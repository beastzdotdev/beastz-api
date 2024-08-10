import { APP_PIPE, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { RedisHealthModule, RedisModule } from '@nestjs-modules/ioredis';
import { TerminusModule } from '@nestjs/terminus';
import { EnvModule } from './@global/env/env.module';
import { PrismaModule } from './@global/prisma/prisma.module';
import { CookieModule } from './@global/cookie/cookie.module';
import { AppController } from './app.controller';
import { AuthGuard } from './authentication/guard/auth.guard';
import { VerifiedEmailGuard } from './authentication/guard/verified-email.guard';
import { UserModule } from './user/user.module';
import { AccountVerificationModule } from './authentication/modules/account-verification/account-verification.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { FeedbackModule } from './feedback/feedback.module';
import { LegalDocumentModule } from './legal-document/legal-document.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './@global/mail/mail.module';
import { AllExceptionsFilter } from '../filters/all-exception.filter';
import { FileStructureModule } from './file-structure/file-structure.module';
import { FileStructureBinModule } from './file-structure-bin/file-structure-bin.module';
import { AppService } from './app.service';
import { UserSupportModule } from './user-support/user-support.module';
import { UserSupportMessageModule } from './user-support-message/user-support-message.module';
import { ENV_SERVICE_TOKEN } from './@global/env/env.constants';
import { EnvService } from './@global/env/env.service';
import { FileStructurePublicShareModule } from './file-structure-public-share/file-structure-public-share.module';
import { JwtModule } from './@global/jwt/jwt.module';
import { DocumentSocketModule } from './@global/socket/document/document-socket.module';

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: (envService: EnvService) => ({
        type: 'single',
        url: envService.get('REDIS_URL'),
        options: {
          lazyConnect: true,
        },
      }),
      inject: [ENV_SERVICE_TOKEN],
    }),
    EnvModule.forRoot(),
    JwtModule,
    TerminusModule,
    RedisHealthModule,
    DocumentSocketModule,
    PrismaModule,
    CookieModule,
    MailModule,
    AccountVerificationModule,
    UserModule,
    AuthenticationModule,
    FeedbackModule,
    LegalDocumentModule,
    AdminModule,
    FileStructureModule,
    FileStructureBinModule,
    UserSupportModule,
    UserSupportMessageModule,
    FileStructurePublicShareModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
        transform: true,
        transformOptions: {
          enableCircularCheck: true,
          enableImplicitConversion: false, // do not enable this param messes up lot of things
        },
      }),
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: VerifiedEmailGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
