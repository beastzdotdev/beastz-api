import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UserModule } from '../user/user.module';
import { RandomModule } from '../../common/modules/random/random.module';
import { EncoderModule } from '../../common/modules/encoder/encoder.module';
import { JwtUtilModule } from '../../common/modules/jwt-util/jwt-util.module';
import { AccountVerificationModule } from './modules/account-verification/account-verification.module';
import { RecoverPasswordModule } from './modules/recover-password/recover-password.module';
import { RefreshTokenModule } from './modules/refresh-token/refresh-tokem.module';
import { UserIdentityModule } from '../user-identity/user-identity.module';
import { AccountVerificationAttemptCountModule } from './modules/account-verification-attempt-count/account-verification-attempt-count.module';
import { RecoverPasswordAttemptCountModule } from './modules/recover-password-attempt-count/recover-password-attempt-count.module';
import { ResetPasswordAttemptCountModule } from './modules/reset-password-attempt-count/reset-password-attempt-count.module';
import { ResetPasswordModule } from './modules/reset-password/reset-password.module';

@Module({
  imports: [
    RefreshTokenModule,
    JwtUtilModule,
    UserModule,
    RecoverPasswordModule,
    RecoverPasswordAttemptCountModule,
    AccountVerificationModule,
    AccountVerificationAttemptCountModule,
    ResetPasswordAttemptCountModule,
    ResetPasswordModule,
    RandomModule,
    EncoderModule,
    UserIdentityModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
