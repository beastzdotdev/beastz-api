import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { PasswordEncoder } from './helper/password.encoder';
import { JwtHelper } from './helper/jwt.helper';
import { AuthenticationController } from './autnentication.controller';
import { UserModule } from '../user/user.module';
import { RecoverPasswordModule } from './recover-password/recover-password.module';
import { AccountVerificationModule } from './account-verification/account-verification.module';
import { RandomModule } from '../../common/modules/random/random.module';

@Module({
  imports: [UserModule, RecoverPasswordModule, AccountVerificationModule, RandomModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, PasswordEncoder, JwtHelper],
  exports: [JwtHelper],
})
export class AuthenticationModule {}
