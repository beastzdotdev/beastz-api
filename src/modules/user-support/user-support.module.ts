import { Module } from '@nestjs/common';
import { UserSupportService } from './user-support.service';
import { SupportController } from './user-support.controller';
import { UserSupportRepository } from './user-support.repository';

@Module({
  providers: [UserSupportService, UserSupportRepository],
  controllers: [SupportController],
  exports: [UserSupportService],
})
export class UserModule {}
