import { Module } from '@nestjs/common';
import { ResetPasswordAttemptCountRepository } from './reset-password-attempt-count.repository';
import { ResetPasswordAttemptCountService } from './reset-password-attempt-count.service';

@Module({
  providers: [ResetPasswordAttemptCountService, ResetPasswordAttemptCountRepository],
  exports: [ResetPasswordAttemptCountService],
})
export class ResetPasswordAttemptCountModule {}
