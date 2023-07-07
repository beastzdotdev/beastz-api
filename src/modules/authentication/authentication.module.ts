import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './autnentication.controller';
import { UserModule } from '../user/user.module';
import { RecoverPasswordModule } from './recover-password/recover-password.module';
import { AccountVerificationModule } from './account-verification/account-verification.module';
import { RandomModule } from '../../common/modules/random/random.module';
import { UserIdentityModule } from './user-identity/user-identity.module';
import { EncoderModule } from '../../common/modules/encoder/encoder.module';
import { JwtUtilModule } from '../../common/modules/jwt-util/jwt-util.module';
import { RefreshTokenModule } from './refresh-token/refresh-tokem.module';

@Module({
  imports: [
    RefreshTokenModule,
    JwtUtilModule,
    UserModule,
    RecoverPasswordModule,
    AccountVerificationModule,
    RandomModule,
    UserIdentityModule,
    EncoderModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
