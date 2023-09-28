import moment from 'moment';
import { v4 as uuid } from 'uuid';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserService } from '../user/user.service';
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
import { AuthRefreshResponseDto } from './dto/auth-refreh-response.dto';
import { TokenExpiredException } from '../../exceptions/token-expired-forbidden.exception';
import { RefreshTokenExpiredException } from '../../exceptions/refresh-token-expired.exception';
import { CookieService } from '../@global/cookie/cookie.service';
import { Response } from 'express';
import { PlatformWrapper } from '../../model/platform.wrapper';
import { UserNotVerifiedException } from '../../exceptions/user-not-verified.exception';
import { RecoverPasswordAttemptCountService } from './modules/recover-password-attempt-count/recover-password-attempt-count.service';
import { AccountVerificationAttemptCountService } from './modules/account-verification-attempt-count/account-verification-attempt-count.service';
import { RefreshParams, SignInParams, SignUpWithTokenParams } from './authentication.types';
import { Constants } from '../../common/constants';
import { ResetPasswordBodyDto } from './dto/reset-password-body.dto';
import { ResetPasswordService } from './modules/reset-password/reset-password.service';
import {
  AccountVerificationConfirmQueryDto,
  AuthenticationPayloadResponseDto,
  RecoverPasswordVerifyQueryDto,
} from './dto';

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
    private readonly recoverPasswordAttemptCountService: RecoverPasswordAttemptCountService,
    private readonly accVerifyAttemptCountServic: AccountVerificationAttemptCountService,
    private readonly resetPasswordHistoryService: ResetPasswordService,
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
    this.userService.validateUser(user, { showNotVerifiedErr: true });

    const passwordMatches = await this.encoderService.matches(params.password, user.userIdentity.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
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

  async resetPassword(body: ResetPasswordBodyDto, userId: number): Promise<void> {
    const { newPassword, oldPassword } = body;
    const user = await this.userService.getByIdIncludeIdentityForGuard(userId);

    this.userService.validateUser(user, { showNotVerifiedErr: true });

    const passwordMatches = await this.encoderService.matches(oldPassword, user.userIdentity.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    const hashedPassword = await this.encoderService.encode(newPassword);

    await Promise.all([
      this.userIdentityService.updatePasswordById(user.userIdentity.id, hashedPassword),
      this.resetPasswordHistoryService.create({ userId: user.id, userIdentityId: user.userIdentity.id }),
    ]);
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

  async recoverPasswordSend(email: string): Promise<void> {
    const user = await this.userService.getByEmailIncludeIdentity(email);
    this.userService.validateUser(user, { showNotVerifiedErr: true });

    const { id: userId } = user;
    const jti = uuid();
    const securityToken = this.jwtUtilService.genRecoverPasswordToken({ email, userId, jti });
    const newPasswordText = this.randomService.generateRandomInt(100000, 999999).toString();
    const newPasswordHashed = await this.encoderService.encode(newPasswordText);

    let recoverPassword = await this.recoverPasswordService.getByUserId(user.id);

    if (recoverPassword) {
      recoverPassword = await this.recoverPasswordService.updateById(recoverPassword.id, {
        securityToken,
        newPassword: newPasswordHashed,
        jti,
      });
    } else {
      recoverPassword = await this.recoverPasswordService.create({
        userId,
        securityToken,
        newPassword: newPasswordHashed,
        jti,
      });
    }

    let recoverPasswordAttemptCount = await this.recoverPasswordAttemptCountService.getByRecoverPasswordId(
      recoverPassword.id,
    );

    if (!recoverPasswordAttemptCount) {
      recoverPasswordAttemptCount = await this.recoverPasswordAttemptCountService.create({
        recoverPasswordId: recoverPassword.id,
      });
    } else {
      const { count, countIncreaseLastUpdateDate } = recoverPasswordAttemptCount;
      const today = moment();

      if (count < 5) {
        await this.recoverPasswordAttemptCountService.updateById(recoverPasswordAttemptCount.id, {
          count: count + 1,
          countIncreaseLastUpdateDate: today.toDate(),
        });

        return;
      }

      // if attempt is max and one day is not gone by at least throw error
      // count >= 5 and less then one day passed
      if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= Constants.ONE_DAY_IN_SEC) {
        throw new ForbiddenException('Please wait for another day to recover password');
      }

      await this.recoverPasswordAttemptCountService.updateById(recoverPasswordAttemptCount.id, {
        count: 0,
        countIncreaseLastUpdateDate: today.toDate(),
      });
    }

    // send recover password id and security token and platform and new password
  }

  async recoverPasswordConfirm(body: RecoverPasswordVerifyQueryDto): Promise<void> {
    const { token, userId } = body;

    const { jti } = this.jwtUtilService.getRecoverPasswordTokenPayload(token);

    // reuse detection
    const recoverPasswordByJti = await this.recoverPasswordService.getByJTI(jti);

    // reuse will be if deleted token is used and more than 1 day is gone
    const tommorow = moment().add(Constants.ONE_DAY_IN_SEC, 'seconds');
    const user = await this.userService.getByIdIncludeIdentityForGuard(userId);

    if (
      recoverPasswordByJti &&
      Boolean(recoverPasswordByJti?.deletedAt) &&
      tommorow.diff(recoverPasswordByJti.deletedAt, 'seconds') >= Constants.ONE_DAY_IN_SEC
    ) {
      // send email here (delete comment after)

      if (user.userIdentity.strictMode) {
        await this.userIdentityService.updateIsLockedById(user.userIdentity.id, true);
      }

      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_TOKEN_REUSE);
    }

    const recoverPassword = await this.recoverPasswordService.getByUserId(userId);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    if (token !== recoverPassword.securityToken) {
      throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_INVALID);
    }

    this.userService.validateUser(user, { showNotVerifiedErr: true });

    await this.jwtUtilService.validateRecoverPasswordToken(token, {
      sub: user.email,
      userId: user.id,
      jti: recoverPassword.jti,
    });

    await Promise.all([
      this.userIdentityService.updatePasswordById(userId, recoverPassword.newPassword),
      this.recoverPasswordService.softDelete(recoverPassword.id),
      this.recoverPasswordAttemptCountService.softDelete(recoverPassword.id),
    ]);

    // show success page and button for redirecting to front end
  }

  async accountVerifySend(email: string): Promise<void> {
    const user = await this.userService.getByEmailIncludeIdentity(email);
    this.userService.validateUser(user, { showIsVerifiedErr: true });

    const { id: userId } = user;
    const jti = uuid();
    const securityToken = this.jwtUtilService.genAccountVerifyToken({ email, userId, jti });

    let accountVerify = await this.accountVerificationService.getByUserId(userId);

    if (accountVerify) {
      accountVerify = await this.accountVerificationService.updateById(accountVerify.id, { securityToken, jti });
    } else {
      accountVerify = await this.accountVerificationService.create({ userId, securityToken, jti });
    }

    let accVerifyAttemptCount = await this.accVerifyAttemptCountServic.getByAccountVerificationId(accountVerify.id);

    if (!accVerifyAttemptCount) {
      accVerifyAttemptCount = await this.accVerifyAttemptCountServic.create({
        accountVerificationId: accountVerify.id,
      });
    } else {
      const { count, countIncreaseLastUpdateDate } = accVerifyAttemptCount;
      const today = moment();

      if (count < 5) {
        await this.accVerifyAttemptCountServic.updateById(accVerifyAttemptCount.id, {
          count: count + 1,
          countIncreaseLastUpdateDate: today.toDate(),
        });

        return;
      }

      // if attempt is max and one day is not gone by at least throw error
      // count >= 5 and less then one day passed
      if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= Constants.ONE_DAY_IN_SEC) {
        throw new ForbiddenException('Please wait for another day to recover password');
      }

      await this.accVerifyAttemptCountServic.updateById(accVerifyAttemptCount.id, {
        count: 0,
        countIncreaseLastUpdateDate: today.toDate(),
      });
    }
  }

  async accountVerificationConfirm(body: AccountVerificationConfirmQueryDto): Promise<void> {
    const { token, userId } = body;

    const { jti } = this.jwtUtilService.getAccountVerifyTokenPayload(token);

    // reuse detection
    const accountVerifyByJti = await this.accountVerificationService.getByJTI(jti);

    // reuse will be if deleted token is used and more than 1 day is gone
    const tommorow = moment().add(Constants.ONE_DAY_IN_SEC, 'seconds');
    const user = await this.userService.getByIdIncludeIdentityForGuard(userId);

    if (
      accountVerifyByJti &&
      Boolean(accountVerifyByJti?.deletedAt) &&
      tommorow.diff(accountVerifyByJti.deletedAt, 'seconds') >= Constants.ONE_DAY_IN_SEC
    ) {
      // send email here (delete comment after)

      if (user.userIdentity.strictMode) {
        await this.userIdentityService.updateIsLockedById(user.userIdentity.id, true);
      }

      throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_TOKEN_REUSE);
    }

    const accountVerify = await this.accountVerificationService.getByUserId(userId);

    if (!accountVerify) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    if (token !== accountVerify.securityToken) {
      throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_INVALID);
    }

    this.userService.validateUser(user, { showIsVerifiedErr: true });

    await this.jwtUtilService.validateAccountVerifyToken(token, {
      sub: user.email,
      userId: user.id,
      jti: accountVerify.jti,
    });

    await Promise.all([
      this.userIdentityService.updateIsAccVerified(userId, true),
      this.accountVerificationService.softDelete(accountVerify.id),
      this.accVerifyAttemptCountServic.softDelete(accountVerify.id),
    ]);

    // show success page and button for redirecting to front end
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
