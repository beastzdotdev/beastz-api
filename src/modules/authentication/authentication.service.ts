import bcrypt from 'bcrypt';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { Response } from 'express';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { helper } from '../../common/helper';
import { random } from '../../common/random';
import { constants } from '../../common/constants';
import { encryption } from '../../common/encryption';
import { UserService } from '../user/user.service';
import { JwtService } from './modules/jwt/jwt.service';
import { EnvService } from '../@global/env/env.service';
import { InjectEnv } from '../@global/env/env.decorator';
import { CookieService } from '../@global/cookie/cookie.service';
import { PlatformWrapper } from '../../model/platform.wrapper';
import { ResetPasswordBodyDto } from './dto/reset-password-body.dto';
import { ResetPasswordService } from './modules/reset-password/reset-password.service';
import { AccountVerificationService } from './modules/account-verification/account-verification.service';
import { RecoverPasswordService } from './modules/recover-password/recover-password.service';
import { RefreshTokenService } from './modules/refresh-token/refresh-token.service';
import { UserIdentityService } from '../user-identity/user-identity.service';
import { TokenExpiredException } from '../../exceptions/token-expired-forbidden.exception';
import { RefreshTokenExpiredException } from '../../exceptions/refresh-token-expired.exception';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { RecoverPasswordAttemptCountService } from './modules/recover-password-attempt-count/recover-password-attempt-count.service';
import { AccountVerificationAttemptCountService } from './modules/account-verification-attempt-count/account-verification-attempt-count.service';
import { RefreshParams, SignInParams } from './authentication.types';
import { ResetPasswordAttemptCountService } from './modules/reset-password-attempt-count/reset-password-attempt-count.service';
import { AuthConfirmQueryDto, AuthenticationPayloadResponseDto, SignUpBodyDto } from './dto';
import { AuthenticationMailService } from './mail/authenctication-mail.service';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { transaction } from '../../common/transaction';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,

    private readonly prismaService: PrismaService,
    private readonly cookieService: CookieService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtUtilService: JwtService,
    private readonly recoverPasswordService: RecoverPasswordService,
    private readonly accountVerificationService: AccountVerificationService,
    private readonly userIdentityService: UserIdentityService,
    private readonly recoverPasswordAttemptCountService: RecoverPasswordAttemptCountService,
    private readonly accVerifyAttemptCountService: AccountVerificationAttemptCountService,
    private readonly resetPasswordService: ResetPasswordService,
    private readonly resetPasswordAttemptCountService: ResetPasswordAttemptCountService,
    private readonly authenticationMailService: AuthenticationMailService,
  ) {}

  async signUpWithToken(res: Response, params: SignUpBodyDto, platform: PlatformWrapper): Promise<Response> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      if (await this.userService.existsByEmail(params.email)) {
        throw new UnauthorizedException(ExceptionMessageCode.USER_EMAIL_EXISTS);
      }

      const { password, ...otherParams } = params;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userService.create(
        {
          ...otherParams,
          profileImagePath: 'default path on object storage of linode', //TODO after storage add from linode
          uuid: uuid(),
        },
        tx,
      );

      await this.userIdentityService.create(
        {
          userId: user.id,
          password: hashedPassword,
        },
        tx,
      );

      await this.pureAccountVerifySend(user.email, tx);

      return this.genTokensAndSendResponse({
        tx,
        res,
        platform,
        isAccountVerified: false,
        email: user.email,
        userId: user.id,
      });
    });
  }

  async signInWithToken(res: Response, params: SignInParams, platform: PlatformWrapper): Promise<Response> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const user = await this.userService.getByEmailIncludeIdentity(params.email).catch(e => {
        throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
      });

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      const passwordMatches = await bcrypt.compare(params.password, user.userIdentity.password);

      if (!passwordMatches) {
        throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
      }

      return this.genTokensAndSendResponse({
        tx,
        res,
        platform,
        email: user.email,
        userId: user.id,
        isAccountVerified: user.userIdentity.isAccountVerified,
      });
    });
  }

  async refreshToken(res: Response, params: RefreshParams, platform: PlatformWrapper): Promise<Response> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { oldRefreshTokenString } = params;

      // Decrypt is session is enabled
      const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
      const key = this.envService.get('SESSION_ACCESS_JWT_ENCRYPTION_KEY');

      const finalOldRefreshTokenString = isEncryptionSessionActive
        ? await encryption.aes256gcm.decrypt(oldRefreshTokenString, key)
        : oldRefreshTokenString;

      if (!finalOldRefreshTokenString) {
        throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
      }

      const refreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(finalOldRefreshTokenString);
      const refreshTokenFromDB = await this.refreshTokenService.getByJTI(refreshTokenPayload.jti, tx);

      // validate user existence from token
      const user = await this.userService.getByIdIncludeIdentity(refreshTokenPayload.userId, tx);
      this.userService.validateUser(user, { showNotVerifiedErr: true });

      // validate signature only (very important)
      await this.jwtUtilService.validateRefreshTokenSignatureOnly(finalOldRefreshTokenString);

      // detect refresh token reuse
      if (!refreshTokenFromDB) {
        await this.refreshTokenService.deleteAllByUserId(user.id, tx);

        const userIdentity = await this.userIdentityService.getByUserId(user.id, tx);

        // send email for resue detection
        if (userIdentity.strictMode) {
          await Promise.all([
            this.userIdentityService.updateIsLockedById(userIdentity.id, true, tx),
            this.authenticationMailService.sendReuse(user.email, true),
          ]);
        } else {
          this.authenticationMailService.sendReuse(user.email, false);
        }

        throw new UnauthorizedException(ExceptionMessageCode.REFRESH_TOKEN_REUSE);
      }

      // validate fully
      try {
        await this.jwtUtilService.validateRefreshToken(finalOldRefreshTokenString, {
          ...refreshTokenFromDB,
          exp: parseInt(refreshTokenFromDB.exp),
          iat: parseInt(refreshTokenFromDB.iat),
        });
      } catch (error) {
        // catch general token expired error, update is used if refresh token is correct and expired
        if (error instanceof TokenExpiredException) {
          await this.refreshTokenService.deleteById(refreshTokenFromDB.id, tx);
          throw new RefreshTokenExpiredException();
        }

        throw error;
      }

      return this.genTokensAndSendResponse({
        tx,
        res,
        platform,
        email: user.email,
        userId: user.id,
        isAccountVerified: user.userIdentity.isAccountVerified,
      });
    });
  }

  async resetPasswordSend(body: ResetPasswordBodyDto, userId: number): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { newPassword, oldPassword } = body;

      // we should not let user know that user not exists than user will use this info for password
      const user = await this.userService.getByIdIncludeIdentity(userId, tx);
      const passwordMatches = await bcrypt.compare(oldPassword, user.userIdentity.password);

      if (!passwordMatches) {
        throw new UnauthorizedException(ExceptionMessageCode.PASSWORD_INVALID);
      }

      if (oldPassword === newPassword) {
        throw new UnauthorizedException(ExceptionMessageCode.NEW_PASSWORD_SAME);
      }

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      const { email } = user;
      const jti = uuid();
      const securityToken = this.jwtUtilService.genResetPasswordToken({ email, userId, jti });
      const newPasswordHashed = await bcrypt.hash(newPassword, 10);

      let resetPassword = await this.resetPasswordService.getByUserId(user.id, tx);

      if (resetPassword) {
        resetPassword = await this.resetPasswordService.updateById(
          resetPassword.id,
          {
            securityToken,
            newPassword: newPasswordHashed,
            jti,
          },
          tx,
        );
      } else {
        resetPassword = await this.resetPasswordService.create(
          {
            userId,
            securityToken,
            newPassword: newPasswordHashed,
            jti,
          },
          tx,
        );
      }

      let resetPasswordAttemptCount = await this.resetPasswordAttemptCountService.getByResetPasswordId(
        resetPassword.id,
        { includeDeleted: false },
        tx,
      );

      if (!resetPasswordAttemptCount) {
        resetPasswordAttemptCount = await this.resetPasswordAttemptCountService.create(
          { resetPasswordId: resetPassword.id },
          tx,
        );
      } else {
        const { count, countIncreaseLastUpdateDate } = resetPasswordAttemptCount;
        const today = moment();

        if (count < constants.MAX_ATTEMPT_COUNT) {
          await this.resetPasswordAttemptCountService.updateById(
            resetPasswordAttemptCount.id,
            {
              count: count + 1,
              countIncreaseLastUpdateDate: today.toDate(),
            },
            tx,
          );

          return;
        }

        // if attempt is max and one day is not gone by at least throw error
        // count >= {x} and less then one day passed
        if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
          throw new ForbiddenException('Please wait for another day to recover password');
        }

        await this.resetPasswordAttemptCountService.updateById(
          resetPasswordAttemptCount.id,
          {
            count: 0,
            countIncreaseLastUpdateDate: today.toDate(),
          },
          tx,
        );
      }

      // send backend url on email for backend to confirm
      const backendUrl = `${this.envService.get('BACKEND_URL')}/auth/reset-password/confirm`;
      const params: AuthConfirmQueryDto = { id: user.id, token: securityToken };

      this.authenticationMailService.sendPasswordReset(
        user.email,
        helper.url.create<AuthConfirmQueryDto>(backendUrl, params),
      );
    });
  }

  async recoverPasswordSend(email: string): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const user = await this.userService.getByEmailIncludeIdentity(email, tx);
      this.userService.validateUser(user, { showNotVerifiedErr: true });

      const { id: userId } = user;
      const jti = uuid();
      const securityToken = this.jwtUtilService.genRecoverPasswordToken({ email, userId, jti });

      // 4 lowercase, 1 int, 1 symbol
      const newPasswordText =
        random.genRandStringFromCharset(10, constants.LETTERS_LOWERCASE) +
        random.generateRandomIntStr(0, 9) +
        random.generateRandomIntStr(0, 9) +
        random.genRandStringFromCharset(1, constants.SYMBOLS);

      const newPasswordHashed = await bcrypt.hash(newPasswordText, 10);

      let recoverPassword = await this.recoverPasswordService.getByUserId(user.id, tx);

      if (recoverPassword) {
        recoverPassword = await this.recoverPasswordService.updateById(
          recoverPassword.id,
          {
            securityToken,
            newPassword: newPasswordHashed,
            jti,
          },
          tx,
        );
      } else {
        recoverPassword = await this.recoverPasswordService.create(
          {
            userId,
            securityToken,
            newPassword: newPasswordHashed,
            jti,
          },
          tx,
        );
      }

      let recoverPasswordAttemptCount = await this.recoverPasswordAttemptCountService.getByRecoverPasswordId(
        recoverPassword.id,
        { includeDeleted: false },
        tx,
      );

      if (!recoverPasswordAttemptCount) {
        recoverPasswordAttemptCount = await this.recoverPasswordAttemptCountService.create(
          { recoverPasswordId: recoverPassword.id },
          tx,
        );
      } else {
        const { count, countIncreaseLastUpdateDate } = recoverPasswordAttemptCount;
        const today = moment();

        if (count < constants.MAX_ATTEMPT_COUNT) {
          await this.recoverPasswordAttemptCountService.updateById(
            recoverPasswordAttemptCount.id,
            {
              count: count + 1,
              countIncreaseLastUpdateDate: today.toDate(),
            },
            tx,
          );

          return;
        }

        // if attempt is max and one day is not gone by at least throw error
        // count >= {x} and less then one day passed
        if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
          throw new ForbiddenException('Please wait for another day to recover password');
        }

        await this.recoverPasswordAttemptCountService.updateById(
          recoverPasswordAttemptCount.id,
          {
            count: 0,
            countIncreaseLastUpdateDate: today.toDate(),
          },
          tx,
        );
      }

      // send backend url on email for backend to confirm
      const backendUrl = `${this.envService.get('BACKEND_URL')}/auth/recover-password/confirm`;
      const params: AuthConfirmQueryDto = { id: user.id, token: securityToken };

      this.authenticationMailService.sendPasswordRecover(
        user.email,
        helper.url.create<AuthConfirmQueryDto>(backendUrl, params),
        newPasswordText,
      );
    });
  }

  async accountVerifySend(email: string): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.pureAccountVerifySend(email, tx);
    });
  }

  async resetPasswordConfirm(body: AuthConfirmQueryDto): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtUtilService.getResetPasswordTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection
      const resetPasswordByJti = await this.resetPasswordService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (resetPasswordByJti && resetPasswordByJti?.deletedAt) {
        const attemptCount = await this.resetPasswordAttemptCountService.getByResetPasswordId(
          resetPasswordByJti.id,
          {
            includeDeleted: true,
          },
          tx,
        );

        if (!attemptCount) {
          throw new InternalServerErrorException('This should not happen');
        }

        const now = moment().toDate();
        const tommorowFromCreation = moment(attemptCount.countIncreaseLastUpdateDate).add(
          constants.ONE_DAY_IN_SEC,
          'seconds',
        );

        // when now is more than x (x is date of auth creation date)
        if (tommorowFromCreation.diff(now, 'seconds') < 0) {
          // send email for resue detection
          if (user.userIdentity.strictMode) {
            await Promise.all([
              this.userIdentityService.updateIsLockedById(user.userIdentity.id, true, tx),
              this.authenticationMailService.sendReuse(user.email, true),
            ]);
          } else {
            this.authenticationMailService.sendReuse(user.email, false);
          }

          throw new ForbiddenException(ExceptionMessageCode.RESET_PASSWORD_TOKEN_REUSE);
        }
      }

      const resetPassword = await this.resetPasswordService.getByUserId(userId, tx);

      if (!resetPassword) {
        throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
      }

      if (token !== resetPassword.securityToken) {
        throw new ForbiddenException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_INVALID);
      }

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      await this.jwtUtilService.validateResetPasswordToken(token, {
        sub: user.email,
        userId: user.id,
        jti: resetPassword.jti,
      });

      await Promise.all([
        this.userIdentityService.updatePasswordById(user.userIdentity.id, resetPassword.newPassword, tx),
        this.resetPasswordService.softDelete(resetPassword.id, tx),
        this.resetPasswordAttemptCountService.softDelete(resetPassword.id, tx),
      ]);

      // show success page and button for redirecting to front end
    });
  }

  async recoverPasswordConfirm(body: AuthConfirmQueryDto): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtUtilService.getRecoverPasswordTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection
      const recoverPasswordByJti = await this.recoverPasswordService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (recoverPasswordByJti && recoverPasswordByJti?.deletedAt) {
        const attemptCount = await this.recoverPasswordAttemptCountService.getByRecoverPasswordId(
          recoverPasswordByJti.id,
          { includeDeleted: true },
          tx,
        );

        if (!attemptCount) {
          throw new InternalServerErrorException('This should not happen');
        }

        const now = moment().toDate();
        const tommorowFromCreation = moment(attemptCount.countIncreaseLastUpdateDate).add(
          constants.ONE_DAY_IN_SEC,
          'seconds',
        );

        // when now is more than x (x is date of auth creation date)
        if (tommorowFromCreation.diff(now, 'seconds') < 0) {
          // send email for resue detection
          if (user.userIdentity.strictMode) {
            await Promise.all([
              this.userIdentityService.updateIsLockedById(user.userIdentity.id, true, tx),
              this.authenticationMailService.sendReuse(user.email, true),
            ]);
          } else {
            this.authenticationMailService.sendReuse(user.email, false);
          }

          throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_TOKEN_REUSE);
        }
      }

      const recoverPassword = await this.recoverPasswordService.getByUserId(userId, tx);

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
        this.userIdentityService.updatePasswordById(user.userIdentity.id, recoverPassword.newPassword, tx),
        this.recoverPasswordService.softDelete(recoverPassword.id, tx),
        this.recoverPasswordAttemptCountService.softDelete(recoverPassword.id, tx),
      ]);

      // show success page and button for redirecting to front end
    });
  }

  async accountVerificationConfirm(body: AuthConfirmQueryDto): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtUtilService.getAccountVerifyTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection
      const accountVerifyByJti = await this.accountVerificationService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (accountVerifyByJti && accountVerifyByJti?.deletedAt) {
        const attemptCount = await this.accVerifyAttemptCountService.getByAccVerifyId(
          accountVerifyByJti.id,
          { includeDeleted: true },
          tx,
        );

        if (!attemptCount) {
          throw new InternalServerErrorException('This should not happen');
        }

        const now = moment().toDate();
        const tommorowFromCreation = moment(attemptCount.countIncreaseLastUpdateDate).add(
          constants.ONE_DAY_IN_SEC,
          'seconds',
        );

        // when now is more than x (x is date of auth creation date)
        if (tommorowFromCreation.diff(now, 'seconds') < 0) {
          // send email for resue detection
          if (user.userIdentity.strictMode) {
            await Promise.all([
              this.userIdentityService.updateIsLockedById(user.userIdentity.id, true, tx),
              this.authenticationMailService.sendReuse(user.email, true),
            ]);
          } else {
            this.authenticationMailService.sendReuse(user.email, false);
          }

          throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_TOKEN_REUSE);
        }
      }

      const accountVerify = await this.accountVerificationService.getByUserId(userId, tx);

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
        this.userIdentityService.updateIsAccVerified(userId, true, tx),
        this.accountVerificationService.softDelete(accountVerify.id, tx),
        this.accVerifyAttemptCountService.softDelete(accountVerify.id, tx),
      ]);

      // show success page and button for redirecting to front end
    });
  }

  private async pureAccountVerifySend(email: string, outsideTransaction: PrismaTx) {
    const user = await this.userService.getByEmailIncludeIdentity(email, outsideTransaction);
    this.userService.validateUser(user, { showIsVerifiedErr: true });

    const { id: userId } = user;
    const jti = uuid();
    const securityToken = this.jwtUtilService.genAccountVerifyToken({ email, userId, jti });

    let accountVerify = await this.accountVerificationService.getByUserId(userId, outsideTransaction);

    if (accountVerify) {
      accountVerify = await this.accountVerificationService.updateById(
        accountVerify.id,
        { securityToken, jti },
        outsideTransaction,
      );
    } else {
      accountVerify = await this.accountVerificationService.create({ userId, securityToken, jti }, outsideTransaction);
    }

    let accVerifyAttemptCount = await this.accVerifyAttemptCountService.getByAccVerifyId(
      accountVerify.id,
      { includeDeleted: false },
      outsideTransaction,
    );

    if (!accVerifyAttemptCount) {
      accVerifyAttemptCount = await this.accVerifyAttemptCountService.create(
        { accountVerificationId: accountVerify.id },
        outsideTransaction,
      );
    } else {
      const { count, countIncreaseLastUpdateDate } = accVerifyAttemptCount;
      const today = moment();

      if (count < constants.MAX_ATTEMPT_COUNT) {
        await this.accVerifyAttemptCountService.updateById(
          accVerifyAttemptCount.id,
          {
            count: count + 1,
            countIncreaseLastUpdateDate: today.toDate(),
          },
          outsideTransaction,
        );

        return;
      }

      // if attempt is max and one day is not gone by at least throw error
      // count >= {x} and less then one day passed
      if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
        throw new ForbiddenException('Please wait for another day to recover password');
      }

      await this.accVerifyAttemptCountService.updateById(
        accVerifyAttemptCount.id,
        {
          count: 0,
          countIncreaseLastUpdateDate: today.toDate(),
        },
        outsideTransaction,
      );
    }

    // send backend url on email for backend to confirm
    const backendUrl = `${this.envService.get('BACKEND_URL')}/auth/account-verify/confirm`;
    const params: AuthConfirmQueryDto = { id: user.id, token: securityToken };

    this.authenticationMailService.sendAccountVerify(
      user.email,
      helper.url.create<AuthConfirmQueryDto>(backendUrl, params),
    );
  }

  private async genTokensAndSendResponse(params: {
    res: Response;
    userId: number;
    email: string;
    platform: PlatformWrapper;
    isAccountVerified: boolean;
    tx?: PrismaTx;
  }): Promise<Response> {
    const { platform, res, isAccountVerified, email, userId, tx } = params;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtUtilService.genAccessToken({ userId, email }),
      this.jwtUtilService.genRefreshToken({ userId, email }),
    ]);

    const refreshTokenPayload = this.jwtUtilService.getRefreshTokenPayload(refreshToken);

    const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
    const key = this.envService.get('SESSION_ACCESS_JWT_ENCRYPTION_KEY');

    const [finalAccessToken, finalRefreshToken] = await Promise.all([
      isEncryptionSessionActive ? await encryption.aes256gcm.encrypt(accessToken, key) : accessToken,
      isEncryptionSessionActive ? await encryption.aes256gcm.encrypt(refreshToken, key) : refreshToken,
      this.refreshTokenService.addRefreshTokenByUserId({ ...refreshTokenPayload, token: refreshToken }, tx),
    ]);

    if (platform.isWeb()) {
      this.cookieService.createCookie(res, {
        accessToken: finalAccessToken,
        refreshToken: finalRefreshToken,
      });

      return res.json(<Partial<AuthenticationPayloadResponseDto>>{ isAccountVerified });
    }

    if (platform.isMobile()) {
      return res.json(<AuthenticationPayloadResponseDto>{
        accessToken: finalAccessToken,
        refreshToken: finalRefreshToken,
        isAccountVerified,
      });
    }

    return res.json({ msg: 'Something went wrong' }).status(500);
  }
}
