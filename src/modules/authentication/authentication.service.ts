import bcrypt from 'bcrypt';
import moment from 'moment';
import crypto from 'crypto';
import { Response } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@global/jwt';
import { CookieService } from '@global/cookie';
import { EnvService, InjectEnv } from '@global/env';
import { PrismaService, PrismaTx } from '@global/prisma';

import { helper, prismaSafeCall } from '../../common/helper';
import { random } from '../../common/random';
import { constants } from '../../common/constants';
import { encryption } from '../../common/encryption';
import { UserService } from '../user/user.service';
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
import { GenTokensAndSendResponseParams, RefreshParams, SignInParams } from './authentication.types';
import { ResetPasswordAttemptCountService } from './modules/reset-password-attempt-count/reset-password-attempt-count.service';
import { AuthConfirmQueryDto, AuthenticationPayloadResponseDto, SignUpBodyDto } from './dto';
import { AuthenticationMailService } from './mail/authenctication-mail.service';
import { transaction } from '../../common/transaction';
import { AuthResponseViewJsonParams } from '../../model/types';
import { AuthPayloadType } from '../../model/auth.types';

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
    private readonly jwtService: JwtService,
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

      const { data: user, error } = await prismaSafeCall(() =>
        this.userService.create(
          {
            ...otherParams,
            profileImagePath: null,
            uuid: crypto.randomUUID(),
          },
          tx,
        ),
      );

      if (error || !user) {
        throw new BadRequestException(error);
      }

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
      const user = await this.userService.getByEmailIncludeIdentity(params.email).catch(() => {
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

  async signOut(res: Response, authPayload: AuthPayloadType, refreshToken: string): Promise<Response> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      // Decrypt is session is enabled
      const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
      const key = this.envService.get('SESSION_JWT_ENCRYPTION_KEY');

      const refreshTokenString = isEncryptionSessionActive
        ? await encryption.aes256gcm.decrypt(refreshToken, key).catch(() => {
            this.logger.error('Failed to decrypt refresh token');
            return null;
          })
        : refreshToken;

      if (!refreshTokenString) {
        throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
      }

      const refreshTokenPayload = this.jwtService.getRefreshTokenPayload(refreshTokenString);

      // delete refresh token from db
      await this.refreshTokenService.deleteByJTI(refreshTokenPayload.jti, tx);

      if (authPayload.platform.isWeb()) {
        this.cookieService.clearCookie(res);

        return res.sendStatus(HttpStatus.OK);
      }

      if (authPayload.platform.isMobile()) {
        return res.sendStatus(HttpStatus.OK);
      }

      return res.json({ msg: 'Something went wrong' }).status(500);
    });
  }

  async refreshToken(res: Response, params: RefreshParams, platform: PlatformWrapper): Promise<Response> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { oldRefreshTokenString } = params;

      // Decrypt is session is enabled
      const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
      const key = this.envService.get('SESSION_JWT_ENCRYPTION_KEY');

      const finalOldRefreshTokenString = isEncryptionSessionActive
        ? await encryption.aes256gcm.decrypt(oldRefreshTokenString, key)
        : oldRefreshTokenString;

      if (!finalOldRefreshTokenString) {
        throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
      }

      const refreshTokenPayload = this.jwtService.getRefreshTokenPayload(finalOldRefreshTokenString);
      const refreshTokenFromDB = await this.refreshTokenService.getByJTI(refreshTokenPayload.jti, tx);

      // validate user existence from token
      const user = await this.userService.getByIdIncludeIdentity(refreshTokenPayload.userId, tx);
      this.userService.validateUser(user, { showNotVerifiedErr: true });

      // validate signature only (very important)
      await this.jwtService.validateRefreshTokenSignatureOnly(finalOldRefreshTokenString);

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
        await this.jwtService.validateRefreshToken(finalOldRefreshTokenString, {
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
      const existingPassword = await this.userService.getUserPasswordOnly(userId, tx);

      const passwordMatches = await bcrypt.compare(oldPassword, existingPassword);

      if (!passwordMatches) {
        throw new UnauthorizedException(ExceptionMessageCode.PASSWORD_INVALID);
      }

      if (oldPassword === newPassword) {
        throw new UnauthorizedException(ExceptionMessageCode.NEW_PASSWORD_SAME);
      }

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      const { email } = user;
      const jti = crypto.randomUUID();
      const securityToken = this.jwtService.genResetPasswordToken({ email, userId, jti });
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
        }
        // if attempt is max and one day is not gone by at least throw error
        // count >= {x} and less then one day passed
        else if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
          throw new ForbiddenException(ExceptionMessageCode.WAIT_FOR_ANOTHER_DAY);
        }
        // set null
        else {
          await this.resetPasswordAttemptCountService.updateById(
            resetPasswordAttemptCount.id,
            {
              count: 0,
              countIncreaseLastUpdateDate: today.toDate(),
            },
            tx,
          );
        }
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
      const jti = crypto.randomUUID();
      const securityToken = this.jwtService.genRecoverPasswordToken({ email, userId, jti });

      // 4 lowercase, 1 int, 1 symbol
      const newPasswordText =
        random.genRandStringFromCharset(10, constants.LETTERS_LOWERCASE) +
        random.generateRandomInt(0, 9).toString() +
        random.generateRandomInt(0, 9).toString() +
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
        }
        // if attempt is max and one day is not gone by at least throw error
        // count >= {x} and less then one day passed
        else if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
          throw new ForbiddenException(ExceptionMessageCode.WAIT_FOR_ANOTHER_DAY);
        }
        // reset
        else {
          await this.recoverPasswordAttemptCountService.updateById(
            recoverPasswordAttemptCount.id,
            {
              count: 0,
              countIncreaseLastUpdateDate: today.toDate(),
            },
            tx,
          );
        }
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

  async resetPasswordConfirm(body: AuthConfirmQueryDto, res: Response): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtService.getResetPasswordTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection (includes null)
      const resetPassword = await this.resetPasswordService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (resetPassword && resetPassword?.deletedAt) {
        const attemptCount = await this.resetPasswordAttemptCountService.getByResetPasswordId(
          resetPassword.id,
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

        // show success page and button for redirecting to front end
        return res.render('view/auth-response', <AuthResponseViewJsonParams>{
          text: 'Reset password already requested',
          frontEndUrl: constants.frontendPath.resetPassword(this.envService.get('FRONTEND_URL')),
          pageTabTitle: 'Reset password confirm',
        });
      }

      if (!resetPassword) {
        throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
      }

      if (token !== resetPassword.securityToken) {
        throw new ForbiddenException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_INVALID);
      }

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      await this.jwtService.validateResetPasswordToken(token, {
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
      res.render('view/auth-response', <AuthResponseViewJsonParams>{
        text: 'Reset password was successsfull',
        frontEndUrl: constants.frontendPath.resetPassword(this.envService.get('FRONTEND_URL')),
        pageTabTitle: 'Reset password confirm',
      });
    });
  }

  async recoverPasswordConfirm(body: AuthConfirmQueryDto, res: Response): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtService.getRecoverPasswordTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection (includes null)
      const recoverPassword = await this.recoverPasswordService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (recoverPassword && recoverPassword?.deletedAt) {
        const attemptCount = await this.recoverPasswordAttemptCountService.getByRecoverPasswordId(
          recoverPassword.id,
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

        // show success page and button for redirecting to front end
        return res.render('view/auth-response', <AuthResponseViewJsonParams>{
          text: 'Recover password already requested',
          frontEndUrl: constants.frontendPath.recoverPassword(this.envService.get('FRONTEND_URL')),
          pageTabTitle: 'Recover password confirm',
        });
      }

      if (!recoverPassword) {
        throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
      }

      if (token !== recoverPassword.securityToken) {
        throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_INVALID);
      }

      this.userService.validateUser(user, { showNotVerifiedErr: true });

      await this.jwtService.validateRecoverPasswordToken(token, {
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
      return res.render('view/auth-response', <AuthResponseViewJsonParams>{
        text: 'Recover password was successsfull',
        frontEndUrl: constants.frontendPath.recoverPassword(this.envService.get('FRONTEND_URL')),
        pageTabTitle: 'Recover password confirm',
      });
    });
  }

  async accountVerificationConfirm(body: AuthConfirmQueryDto, res: Response): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { token } = body;
      const { jti, userId } = this.jwtService.getAccountVerifyTokenPayload(token);

      const user = await this.userService.getByIdIncludeIdentity(userId, tx);

      // reuse detection (includes null)
      const accountVerify = await this.accountVerificationService.getByJTI(jti, tx);

      // reuse will be if deleted token is used and more than 1 day is gone
      if (accountVerify && accountVerify?.deletedAt) {
        const attemptCount = await this.accVerifyAttemptCountService.getByAccVerifyId(
          accountVerify.id,
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

        // show already verified page
        return res.render('view/auth-response', <AuthResponseViewJsonParams>{
          text: 'Account verify already requested',
          frontEndUrl: constants.frontendPath.accountVerify(this.envService.get('FRONTEND_URL')),
          pageTabTitle: 'Account verify confirm',
        });
      }

      if (!accountVerify) {
        throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
      }

      if (token !== accountVerify.securityToken) {
        throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_INVALID);
      }

      this.userService.validateUser(user, { showIsVerifiedErr: true });

      await this.jwtService.validateAccountVerifyToken(token, {
        sub: user.email,
        userId: user.id,
        jti: accountVerify.jti,
      });

      await Promise.all([
        //TODO same method combine
        this.userIdentityService.updateIsAccVerified(userId, true, tx),
        this.userIdentityService.updateIsLockedById(user.userIdentity.id, false, tx),
        this.accountVerificationService.softDelete(accountVerify.id, tx),
        this.accVerifyAttemptCountService.softDelete(accountVerify.id, tx),
      ]);

      //TODO on success for user create every folder with user {uuid} unser user-content, user-bin, etc ...

      // show success page and button for redirecting to front end
      res.render('view/auth-response', <AuthResponseViewJsonParams>{
        text: 'Account verify was successsfull',
        frontEndUrl: constants.frontendPath.accountVerify(this.envService.get('FRONTEND_URL')),
        pageTabTitle: 'Account verify confirm',
      });
    });
  }

  private async pureAccountVerifySend(email: string, outsideTransaction: PrismaTx) {
    const user = await this.userService.getByEmailIncludeIdentity(email, outsideTransaction);
    this.userService.validateUser(user, { showIsVerifiedErr: true });

    const { id: userId } = user;
    const jti = crypto.randomUUID();
    const securityToken = this.jwtService.genAccountVerifyToken({ email, userId, jti });

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
      }
      // if attempt is max and one day is not gone by at least throw error
      // count >= {x} and less then one day passed
      else if (today.diff(countIncreaseLastUpdateDate, 'seconds') <= constants.ONE_DAY_IN_SEC) {
        throw new ForbiddenException(ExceptionMessageCode.WAIT_FOR_ANOTHER_DAY);
      }
      // reset count
      else {
        await this.accVerifyAttemptCountService.updateById(
          accVerifyAttemptCount.id,
          {
            count: 0,
            countIncreaseLastUpdateDate: today.toDate(),
          },
          outsideTransaction,
        );
      }
    }

    // send backend url on email for backend to confirm
    const backendUrl = `${this.envService.get('BACKEND_URL')}/auth/account-verify/confirm`;
    const params: AuthConfirmQueryDto = { id: user.id, token: securityToken };

    this.authenticationMailService.sendAccountVerify(
      user.email,
      helper.url.create<AuthConfirmQueryDto>(backendUrl, params),
    );
  }

  private async genTokensAndSendResponse(params: GenTokensAndSendResponseParams): Promise<Response> {
    const { platform, res, isAccountVerified, email, userId, tx } = params;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.genAccessToken({ userId, email, platform }),
      this.jwtService.genRefreshToken({ userId, email, platform }),
    ]);

    const refreshTokenPayload = this.jwtService.getRefreshTokenPayload(refreshToken);

    const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
    const key = this.envService.get('SESSION_JWT_ENCRYPTION_KEY');

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
