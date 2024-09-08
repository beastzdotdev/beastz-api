import { Module } from '@nestjs/common';
import { MailModule } from '@global/mail';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [MailModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
