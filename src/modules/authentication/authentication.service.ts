import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserService } from '../user/user.service';
import { AccountVerificationConfirmCodeDto, AuthenticationPayloadResponseDto } from './dto';
import { RandomService } from '../../common/modules/random/random.service';
import { EncoderService } from '../../common/modules/encoder/encoder.service';
import { JwtUtilService } from '../../common/modules/jwt-util/jwt-util.service';
import { AccountVerificationService } from './modules/account-verification/account-verification.service';
import { RecoverPasswordService } from './modules/recover-password/recover-password.service';
import { RefreshTokenService } from './modules/refresh-token/refresh-token.service';
import { UserIdentityService } from '../user-identity/user-identity.service';
import { EnvService } from '../@global/env/env.service';
import { InjectEnv } from '../@global/env/env.decorator';
import { encryption } from '../../common/encryption';
import {
  RecoverPasswordConfirmCodeParams,
  RecoverPasswordParams,
  RefreshParams,
  SignInParams,
  SignUpWithTokenParams,
} from './authentication.types';
import { AuthRefreshResponseDto } from './dto/auth-refreh-response.dto';
import { TokenExpiredException } from '../../exceptions/token-expired-forbidden.exception';
import { RefreshTokenExpiredException } from '../../exceptions/refresh-token-expired.exception';
import { CookieService } from '../@global/cookie/cookie.service';
import { Response } from 'express';
import { PlatformWrapper } from '../../model/platform.wrapper';
import { UserLockedException } from '../../exceptions/user-locked.exception';
import { UserBlockedException } from '../../exceptions/user-blocked.exception';
import { UserNotVerifiedException } from '../../exceptions/user-not-verified.exception';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,

    private readonly cookieService: CookieService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly encoderService: EncoderService,
    private readonly jwtUtilService: JwtUtilService,
    private readonly randomService: RandomService,
    private readonly recoverPasswordService: RecoverPasswordService,
    private readonly accountVerificationService: AccountVerificationService,
    private readonly userIdentityService: UserIdentityService,
  ) {}

  async signUpWithToken(res: Response, params: SignUpWithTokenParams, platform: PlatformWrapper): Promise<Response> {
    if (await this.userService.existsByEmail(params.email)) {
      throw new UnauthorizedException(ExceptionMessageCode.USER_EMAIL_EXISTS);
    }

    const { password, ...otherParams } = params;
    const hashedPassword = await this.encoderService.encode(password);

    const user = await this.userService.create({
      ...otherParams,
      isOnline: false,
      profileImagePath: null,
    });

    const { accessToken, refreshToken, refreshTokenPayload, cypherIV, refreshKeyEncrypted } =
      await this.genAccessAndRefreshToken({
        userId: user.id,
        email: params.email,
      });

    await Promise.all([
      this.userIdentityService.create({ password: hashedPassword, userId: user.id }),
      this.refreshTokenService.addRefreshTokenByUserId({
        ...refreshTokenPayload,
        secretKeyEncrypted: refreshKeyEncrypted,
        token: refreshToken,
        cypherIV,
      }),
    ]);

    if (platform.isWeb()) {
      this.cookieService.createCookie(res, {
        accessToken,
        refreshToken,
      });

      return res.json(<Partial<AuthenticationPayloadResponseDto>>{
        isAccountVerified: false,
      });
    }

    if (platform.isMobile()) {
      return res.json(<AuthenticationPayloadResponseDto>{
        accessToken,
        refreshToken,
        isAccountVerified: false,
      });
    }

    return res.json({ msg: 'Something went wrong' }).status(500);
  }

  async signInWithToken(res: Response, params: SignInParams, platform: PlatformWrapper): Promise<Response> {
    const user = await this.userService.getByEmailIncludeIdentity(params.email);

    if (!user) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    if (!user.userIdentity) {
      throw new UnauthorizedException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    const passwordMatches = await this.encoderService.matches(params.password, user.userIdentity.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    if (user.userIdentity.isBlocked) {
      throw new UserBlockedException();
    }

    if (user.userIdentity.isLocked) {
      throw new UserLockedException();
    }

    const isAccountVerified = user.userIdentity?.isAccountVerified ?? false;

    if (!isAccountVerified) {
      throw new UserNotVerifiedException();
    }

    const { accessToken, refreshToken, refreshTokenPayload, cypherIV, refreshKeyEncrypted } =
      await this.genAccessAndRefreshToken({
        userId: user.id,
        email: params.email,
      });

    await this.refreshTokenService.addRefreshTokenByUserId({
      ...refreshTokenPayload,
      secretKeyEncrypted: refreshKeyEncrypted,
      token: refreshToken,
      cypherIV,
    });

    if (platform.isWeb()) {
      this.cookieService.createCookie(res, {
        accessToken,
        refreshToken,
      });

      return res.json(<Partial<AuthenticationPayloadResponseDto>>{
        isAccountVerified: user.userIdentity.isAccountVerified,
      });
    }

    if (platform.isMobile()) {
      return res.json(<AuthenticationPayloadResponseDto>{
        accessToken,
        refreshToken,
        isAccountVerified: user.userIdentity.isAccountVerified,
      });
    }

    return res.json({ msg: 'Something went wrong' }).status(500);
  }

  async refreshToken(res: Response, params: RefreshParams, platform: PlatformWrapper): Promise<Response> {
    const { oldRefreshTokenString } = params;
    const refreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(oldRefreshTokenString);
    const refreshTokenFromDB = await this.refreshTokenService.getByJTI(refreshTokenPayload.jti);

    // validate user existence from token
    const user = await this.userService.getById(refreshTokenPayload.userId);

    // get refresh token secret and decrypt it
    const refreshTokenSecretDecrypted = await encryption.aes256cbc.decrypt(
      refreshTokenFromDB.secretKeyEncrypted,
      this.envService.get('REFRESH_TOKEN_ENCRYPTION_SECRET'),
      refreshTokenFromDB.cypherIV,
    );

    // should not happen
    if (!refreshTokenSecretDecrypted) {
      throw new InternalServerErrorException('Something went wrong');
    }

    // validate fully
    try {
      await this.jwtUtilService.validateRefreshToken(oldRefreshTokenString, {
        ...refreshTokenFromDB,
        exp: parseInt(refreshTokenFromDB.exp),
        iat: parseInt(refreshTokenFromDB.iat),
        secret: refreshTokenSecretDecrypted,
      });
    } catch (error) {
      // catch general token expired error, update is used if refresh token is correct and expired
      if (error instanceof TokenExpiredException) {
        await this.refreshTokenService.updateIsUsedById(refreshTokenFromDB.id);
        throw new RefreshTokenExpiredException();
      }

      throw error;
    }

    // detect refresh token reuse
    if (refreshTokenFromDB.isUsed) {
      await this.refreshTokenService.updateIsUsedForAllByUserId(user.id);

      const userIdentity = await this.userIdentityService.getByUserId(user.id);

      // send email here (delete comment after)

      if (userIdentity.strictMode) {
        await this.userIdentityService.updateIsLockedById(userIdentity.id, true);
      }

      throw new UnauthorizedException(ExceptionMessageCode.REFRESH_TOKEN_REUSE);
    }

    const { accessToken } = await this.genAccessToken({
      userId: user.id,
      email: user.email,
    });

    if (platform.isWeb()) {
      this.cookieService.createCookie(res, { accessToken });
      return res.json({ msg: 'success' });
    }

    if (platform.isMobile()) {
      return res.json(<AuthRefreshResponseDto>{ accessToken });
    }

    return res.json({ msg: 'Something went wrong' }).status(500);
  }

  async recoverPasswordSendVerificationCode(email: string): Promise<void> {
    const user = await this.userService.getByEmail(email);

    if (!user) {
      throw new UnauthorizedException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    const oneTimeCode = this.randomService.generateRandomInt(100000, 999999);

    await this.recoverPasswordService.upsert({
      oneTimeCode,
      userId: user.id,
      isVerified: false,
      uuid: uuid(),
    });

    // send one time code to user on mail here
  }

  async recoverPasswordConfirmCode(body: RecoverPasswordConfirmCodeParams): Promise<{ uuid: string }> {
    const { code, email } = body;

    const userId = await this.userService.getIdByEmail(email);

    const recoverPasswordRequest = await this.recoverPasswordService.getByUserId(userId);

    if (recoverPasswordRequest.oneTimeCode !== code) {
      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_INVALID_CODE);
    }

    // if 30 minute is passed
    if (
      Date.now() - recoverPasswordRequest.createdAt.getTime() >
      this.envService.get('RECOVER_PASSWORD_REQUEST_TIMEOUT_IN_MILLIS')
    ) {
      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_TIMED_OUT);
    }

    const generatedUUID = uuid();

    await this.recoverPasswordService.updateById(recoverPasswordRequest.id, {
      uuid: generatedUUID,
      isVerified: true,
    });

    return {
      uuid: generatedUUID,
    };
  }

  async recoverPassword(body: RecoverPasswordParams): Promise<void> {
    const { password, uuid } = body;
    const recoverPasswordRequest = await this.recoverPasswordService.getByUUID(uuid);

    if (!recoverPasswordRequest.isVerified) {
      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_INVALID);
    }

    const hashedPassword = await this.encoderService.encode(password);

    await Promise.all([
      this.recoverPasswordService.deleteById(uuid),
      this.userIdentityService.updatePasswordById(recoverPasswordRequest.userId, hashedPassword),
    ]);
  }

  async sendAccountVerificationCode(email: string) {
    const oneTimeCode = this.randomService.generateRandomInt(100000, 999999);
    const user = await this.userService.getByEmailIncludeIdentity(email);

    if (!user) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    if (!user.userIdentity) {
      throw new UnauthorizedException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    await this.accountVerificationService.upsert({
      oneTimeCode,
      userId: user.id,
    });

    // send one time code to user on mail here
  }

  async accountVerificationConfirmCode(body: AccountVerificationConfirmCodeDto) {
    const { code, email } = body;

    const user = await this.userService.getByEmailIncludeIdentity(email);

    if (!user) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    if (!user.userIdentity) {
      throw new UnauthorizedException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    const accountVerification = await this.accountVerificationService.getByUserId(user.id);

    if (!accountVerification) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    if (accountVerification.oneTimeCode !== code) {
      throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_INVALID_CODE);
    }

    // if 30 minute is passed
    if (
      Date.now() - accountVerification.createdAt.getTime() >
      this.envService.get('ACCOUNT_VERIFICATION_REQUEST_TIMEOUT_IN_MILLIS')
    ) {
      throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_TIMED_OUT);
    }

    await this.userIdentityService.updateIsAccVerified(user.id, true);
  }

  private async genAccessAndRefreshToken(params: { userId: number; email: string }) {
    const { accessToken } = await this.genAccessToken({
      userId: params.userId,
      email: params.email,
    });
    const { cypherIV, refreshKeyEncrypted, refreshToken, refreshTokenPayload } = await this.genRefreshToken({
      userId: params.userId,
      email: params.email,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenPayload,
      refreshKeyEncrypted,
      cypherIV,
    };
  }

  private async genRefreshToken(params: { userId: number; email: string }) {
    const refreshTokenSecret = this.randomService.generateRandomASCII(32);
    const cypherIV = encryption.aes256cbc.genIv();
    const refreshKeyEncrypted = await encryption.aes256cbc.encrypt(
      refreshTokenSecret,
      this.envService.get('REFRESH_TOKEN_ENCRYPTION_SECRET'),
      cypherIV,
    );

    if (!refreshKeyEncrypted) {
      throw new InternalServerErrorException('Something went wrong');
    }

    const refreshToken = this.jwtUtilService.genRefreshToken({
      userId: params.userId,
      email: params.email,
      refreshKeySecret: refreshTokenSecret,
    });

    const refreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(refreshToken);

    return {
      refreshToken,
      refreshTokenPayload,
      refreshKeyEncrypted,
      cypherIV,
    };
  }

  private async genAccessToken(params: { userId: number; email: string }) {
    const accessToken = this.jwtUtilService.genAccessToken({
      userId: params.userId,
      email: params.email,
    });

    return {
      accessToken,
    };
  }
}
