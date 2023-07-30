import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as genUUID } from 'uuid';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserService } from '../user/user.service';
import { AuthenticationPayloadResponseDto } from './dto';
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
  SignInParams,
  SignUpWithTokenParams,
} from './authentication.types';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,

    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly encoderService: EncoderService,
    private readonly jwtUtilService: JwtUtilService,
    private readonly randomService: RandomService,
    private readonly recoverPasswordService: RecoverPasswordService,
    private readonly accountVerificationService: AccountVerificationService,
    private readonly userIdentityService: UserIdentityService,
  ) {}

  async signUpWithToken(params: SignUpWithTokenParams): Promise<AuthenticationPayloadResponseDto> {
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

    return { accessToken, refreshToken, hasEmailVerified: false };
  }

  async signInWithToken(params: SignInParams): Promise<AuthenticationPayloadResponseDto> {
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

    const { accessToken, refreshToken, refreshTokenPayload, cypherIV, refreshKeyEncrypted } =
      await this.genAccessAndRefreshToken({
        userId: user.id,
        email: params.email,
      });

    const [hasEmailVerified] = await Promise.all([
      this.accountVerificationService.getIsVerifiedByUserId(user.id),
      this.refreshTokenService.addRefreshTokenByUserId({
        ...refreshTokenPayload,
        secretKeyEncrypted: refreshKeyEncrypted,
        token: refreshToken,
        cypherIV,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      hasEmailVerified,
    };
  }

  async refreshToken(oldRefreshTokenString: string): Promise<AuthenticationPayloadResponseDto> {
    const oldRefreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(oldRefreshTokenString);
    const oldRefreshToken = await this.refreshTokenService.getByJTI(oldRefreshTokenPayload.jti);

    // validate user existence from token
    const user = await this.userService.getById(oldRefreshTokenPayload.userId);

    // detect refresh token reuse
    if (oldRefreshToken.isUsed) {
      await this.refreshTokenService.updateIsUsedForAllByUserId(user.id);

      const userIdentity = await this.userIdentityService.getByUserId(user.id);

      // send email here (delete comment after)

      if (userIdentity.strictMode) {
        await this.userIdentityService.updateLockedById(userIdentity.id, true);
      }

      throw new UnauthorizedException(ExceptionMessageCode.REFRESH_TOKEN_REUSE);
    }

    // get refresh token secret and decrypt it
    const refreshTokenSecretDecrypted = await encryption.aes256cbc.decrypt(
      oldRefreshToken.secretKeyEncrypted,
      this.envService.get('REFRESH_TOKEN_ENCRYPTION_SECRET'),
      oldRefreshToken.cypherIV,
    );

    // should not happen
    if (!refreshTokenSecretDecrypted) {
      throw new InternalServerErrorException('Something went wrong');
    }

    // validate fully
    await this.jwtUtilService.validateRefreshToken(oldRefreshTokenString, {
      ...oldRefreshToken,
      exp: parseInt(oldRefreshToken.exp),
      iat: parseInt(oldRefreshToken.iat),
      secret: refreshTokenSecretDecrypted,
    });

    const [{ accessToken, refreshToken, refreshTokenPayload, cypherIV, refreshKeyEncrypted }] = await Promise.all([
      this.genAccessAndRefreshToken({
        userId: user.id,
        email: user.email,
      }),

      // update is used for old refresh token
      this.refreshTokenService.updateIsUsedById(oldRefreshToken.id),
    ]);

    await this.refreshTokenService.addRefreshTokenByUserId({
      ...refreshTokenPayload,
      secretKeyEncrypted: refreshKeyEncrypted,
      token: refreshToken,
      cypherIV,
    });

    return {
      accessToken,
      refreshToken,
    };
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
      uuid: genUUID(),
    });

    // send one time code to user on mail here
  }

  //TODO fix this
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

    const uuid = genUUID();

    await this.recoverPasswordService.updateById(recoverPasswordRequest.id, {
      uuid,
      isVerified: true,
    });

    return { uuid };
  }

  //TODO fix this
  async recoverPassword(body: RecoverPasswordParams): Promise<void> {
    const { password, uuid } = body;
    const recoverPasswordRequest = await this.recoverPasswordService.getByUUID(uuid);

    if (!recoverPasswordRequest.isVerified) {
      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_INVALID);
    }

    const hashedPassword = await this.encoderService.encode(password);

    await this.recoverPasswordService.deleteById(uuid);
    await this.userIdentityService.updatePasswordById(recoverPasswordRequest.userId, hashedPassword);
  }

  //TODO fix this
  async sendAccountVerificationCode(userId: number) {
    const oneTimeCode = this.randomService.generateRandomInt(100000, 999999);

    await this.accountVerificationService.upsert({ oneTimeCode, userId });

    //TODO send one time code to user on mail
  }

  //TODO fix this
  async accountVerificationConfirmCode(userId: number, code: number) {
    const accountVerification = await this.accountVerificationService.getByUserId(userId);

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

    await this.accountVerificationService.updateIsVerified(userId, true);
  }

  private async genAccessAndRefreshToken(params: { userId: number; email: string }) {
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

    const accessToken = this.jwtUtilService.genAccessToken({
      userId: params.userId,
      email: params.email,
    });
    const refreshToken = this.jwtUtilService.genRefreshToken({
      userId: params.userId,
      email: params.email,
      refreshKeySecret: refreshTokenSecret,
    });

    const refreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(refreshToken);

    return {
      accessToken,
      refreshToken,
      refreshTokenPayload,
      refreshKeyEncrypted,
      cypherIV,
    };
  }
}
