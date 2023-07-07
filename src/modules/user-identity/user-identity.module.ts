import { Module } from '@nestjs/common';
import { UserIdentityService } from './user-identity.service';

@Module({
  providers: [UserIdentityService],
  exports: [UserIdentityService],
})
export class UserIdentityModule {}
