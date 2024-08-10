import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UserModule } from '../user/user.module';
import { AccountVerificationModule } from './modules/account-verification/account-verification.module';
import { RecoverPasswordModule } from './modules/recover-password/recover-password.module';
import { RefreshTokenModule } from './modules/refresh-token/refresh-tokem.module';
import { UserIdentityModule } from '../user-identity/user-identity.module';
import { AccountVerificationAttemptCountModule } from './modules/account-verification-attempt-count/account-verification-attempt-count.module';
import { RecoverPasswordAttemptCountModule } from './modules/recover-password-attempt-count/recover-password-attempt-count.module';
import { ResetPasswordAttemptCountModule } from './modules/reset-password-attempt-count/reset-password-attempt-count.module';
import { ResetPasswordModule } from './modules/reset-password/reset-password.module';
import { AuthenticationMailService } from './mail/authenctication-mail.service';

@Module({
  imports: [
    RefreshTokenModule,
    UserModule,
    RecoverPasswordModule,
    RecoverPasswordAttemptCountModule,
    AccountVerificationModule,
    AccountVerificationAttemptCountModule,
    ResetPasswordAttemptCountModule,
    ResetPasswordModule,
    UserIdentityModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, AuthenticationMailService],
})
export class AuthenticationModule {}
