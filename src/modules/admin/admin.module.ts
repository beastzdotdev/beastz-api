import { Module } from '@nestjs/common';
import { MailConfigModule } from '@global/mail';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [MailConfigModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
