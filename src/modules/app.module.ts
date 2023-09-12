import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { EnvModule } from './@global/env/env.module';
import { PrismaModule } from './@global/prisma/prisma.module';
import { CookieModule } from './@global/cookie/cookie.module';
import { AppController } from './app.controller';
import { AuthGuard } from './authentication/guard/auth.guard';
import { VerifiedEmailGuard } from './authentication/guard/verified-email.guard';
import { JwtUtilModule } from '../common/modules/jwt-util/jwt-util.module';
import { UserModule } from './user/user.module';
import { AccountVerificationModule } from './authentication/modules/account-verification/account-verification.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { FeedbackModule } from './feedback/feedback.module';
import { LegalDocumentModule } from './legal-document/legal-document.module';

@Module({
  imports: [
    EnvModule.forRoot(),
    PrismaModule,
    CookieModule,
    JwtUtilModule,
    AccountVerificationModule,
    UserModule,
    AuthenticationModule,
    FeedbackModule,
    LegalDocumentModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }),
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: VerifiedEmailGuard,
    },
  ],
})
export class AppModule {}
