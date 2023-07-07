import { Module } from '@nestjs/common';
import { RecoverPasswordRepository } from './recover-password.repository';
import { RecoverPasswordService } from './recover-password.service';

@Module({
  providers: [RecoverPasswordService, RecoverPasswordRepository],
  exports: [RecoverPasswordService],
})
export class RecoverPasswordModule {}
