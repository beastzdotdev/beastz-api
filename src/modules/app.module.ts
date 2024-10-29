import { APP_PIPE, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { RedisHealthModule } from '@nestjs-modules/ioredis';
import { TerminusModule } from '@nestjs/terminus';

import { JwtConfigModule } from '@global/jwt';
import { MailConfigModule } from '@global/mail';
import { PrismaConfigModule } from '@global/prisma';
import { CookieConfigModule } from '@global/cookie';
import { EventEmitterConfigModule } from '@global/event-emitter';
import { EnvConfigModule } from '@global/env';
import { RedisConfigModule } from '@global/redis';
import { ValidationConfigFactoryPipe } from '@global/validation';
import { SocketConfigModule } from '@global/socket';

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
    //* third party packages
    TerminusModule,
    RedisHealthModule,

    //* from global directory
    EnvConfigModule.forRoot(),
    RedisConfigModule.forRoot(),
    EventEmitterConfigModule.forRoot(),
    JwtConfigModule,
    MailConfigModule,
    PrismaConfigModule,
    CookieConfigModule,
    SocketConfigModule,

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
      useValue: ValidationConfigFactoryPipe.create(),
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
