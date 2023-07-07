import { Module } from '@nestjs/common';
import { AccountVerificationRepository } from './account-verification.repository';
import { AccountVerificationService } from './account-verification.service';

@Module({
  providers: [AccountVerificationService, AccountVerificationRepository],
  exports: [AccountVerificationService],
})
export class AccountVerificationModule {}
