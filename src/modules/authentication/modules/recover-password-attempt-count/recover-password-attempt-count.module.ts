import { Module } from '@nestjs/common';
import { RecoverPasswordAttemptCountRepository } from './recover-password-attempt-count.repository';
import { RecoverPasswordAttemptCountService } from './recover-password-attempt-count.service';

@Module({
  providers: [RecoverPasswordAttemptCountService, RecoverPasswordAttemptCountRepository],
  exports: [RecoverPasswordAttemptCountService],
})
export class RecoverPasswordAttemptCountModule {}
