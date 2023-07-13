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

@Module({
  imports: [
    RefreshTokenModule,
    JwtUtilModule,
    UserModule,
    RecoverPasswordModule,
    AccountVerificationModule,
    RandomModule,
    EncoderModule,
    UserIdentityModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
