import { APP_PIPE, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { RedisHealthModule, RedisModule } from '@nestjs-modules/ioredis';
import { TerminusModule } from '@nestjs/terminus';
import { JwtModule } from '@global/jwt';
import { MailModule } from '@global/mail';
import { PrismaModule } from '@global/prisma';
import { CookieModule } from '@global/cookie';
import { DocumentSocketModule } from '@global/socket';
import { RedisServicesModule } from '@global/redis-services';
import { EventEmitterConfigModule } from '@global/event-emitter';
import { EnvConfigModule, ENV_SERVICE_TOKEN, EnvService } from '@global/env';

import { AppController } from './app.controller';
import { AuthGuard } from './authentication/guard/auth.guard';
import { VerifiedEmailGuard } from './authentication/guard/verified-email.guard';
import { UserModule } from './user/user.module';
import { AccountVerificationModule } from './authentication/modules/account-verification/account-verification.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { FeedbackModule } from './feedback/feedback.module';
import { LegalDocumentModule } from './legal-document/legal-document.module';
import { AdminModule } from './admin/admin.module';
import { AllExceptionsFilter } from '../filters/all-exception.filter';
import { FileStructureModule } from './file-structure/file-structure.module';
import { FileStructureBinModule } from './file-structure-bin/file-structure-bin.module';
import { AppService } from './app.service';
import { UserSupportModule } from './user-support/user-support.module';
import { UserSupportMessageModule } from './user-support-message/user-support-message.module';
import { FileStructurePublicShareModule } from './file-structure-public-share/file-structure-public-share.module';

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
    EnvConfigModule.forRoot(),
    EventEmitterConfigModule.forRoot(),
    JwtModule,
    TerminusModule,
    RedisHealthModule,
    DocumentSocketModule,
    PrismaModule,
    CookieModule,
    MailModule,
    AccountVerificationModule,
    UserModule,
    RedisServicesModule,
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
