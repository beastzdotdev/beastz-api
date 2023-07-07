import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvModule } from './@global/env/env.module';
import { PrismaModule } from './@global/prisma/prisma.module';
import { APP_PIPE, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthPayloadInterceptor } from './authentication/auth-payload.interceptor';
import { JwtAuthGuard } from './authentication/guard/jwt-auth.guard';
import { VerifiedEmailValidatorGuard } from './authentication/guard/verified-email-validator.guard';
import { JwtUtilModule } from '../common/modules/jwt-util/jwt-util.module';
import { UserModule } from './user/user.module';
import { AccountVerificationModule } from './authentication/modules/account-verification/account-verification.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    EnvModule.forRoot(),
    JwtUtilModule,
    AccountVerificationModule,
    PrismaModule,
    UserModule,
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: VerifiedEmailValidatorGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthPayloadInterceptor,
    },
  ],
})
export class AppModule {}
