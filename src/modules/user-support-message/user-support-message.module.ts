import { Module } from '@nestjs/common';
import { UserSupportMessageService } from './user-support-message.service';
import { UserSupportMessageController } from './user-support-message.controller';
import { UserSupportMessageRepository } from './user-support-message.repository';
import { UserSupportModule } from '../user-support/user-support.module';
import { UserSupportImageModule } from '../user-support-image/user-support-image.module';

@Module({
  imports: [UserSupportModule, UserSupportImageModule],
  providers: [UserSupportMessageService, UserSupportMessageRepository],
  controllers: [UserSupportMessageController],
  exports: [UserSupportMessageService],
})
export class UserSupportMessageModule {}
