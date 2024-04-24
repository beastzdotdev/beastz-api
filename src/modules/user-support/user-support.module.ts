import { Module } from '@nestjs/common';
import { UserSupportService } from './user-support.service';
import { UserSupportController } from './user-support.controller';
import { UserSupportRepository } from './user-support.repository';

@Module({
  providers: [UserSupportService, UserSupportRepository],
  controllers: [UserSupportController],
  exports: [UserSupportService],
})
export class UserSupportModule {}
