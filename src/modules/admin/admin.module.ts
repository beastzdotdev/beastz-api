import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MailModule } from '../@global/mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
