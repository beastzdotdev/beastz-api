import { Module } from '@nestjs/common';
import { UserSupportImageService } from './user-support-image.service';
import { UserSupportImageRepository } from './user-support-image.repository';
import { UserSupportModule } from '../user-support/user-support.module';

@Module({
  imports: [UserSupportModule],
  providers: [UserSupportImageService, UserSupportImageRepository],
  exports: [UserSupportImageService],
})
export class UserSupportImageModule {}
