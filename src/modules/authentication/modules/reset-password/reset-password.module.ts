import { Module } from '@nestjs/common';
import { ResetPasswordRepository } from './reset-password.repository';
import { ResetPasswordService } from './reset-password.service';

@Module({
  providers: [ResetPasswordService, ResetPasswordRepository],
  exports: [ResetPasswordService],
})
export class ResetPasswordModule {}
