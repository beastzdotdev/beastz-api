import { Module } from '@nestjs/common';
import { AccountVerificationAttemptCountRepository } from './account-verification-attempt-count.repository';
import { AccountVerificationAttemptCountService } from './account-verification-attempt-count.service';

@Module({
  providers: [AccountVerificationAttemptCountService, AccountVerificationAttemptCountRepository],
  exports: [AccountVerificationAttemptCountService],
})
export class AccountVerificationAttemptCountModule {}
