import { Module } from '@nestjs/common';
import { UserIdentityService } from './user-identity.service';
import { UserIdentityRepository } from './user-identity.repository';

@Module({
  providers: [UserIdentityService, UserIdentityRepository],
  exports: [UserIdentityService],
})
export class UserIdentityModule {}
