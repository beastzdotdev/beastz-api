import { Controller, Get, Query } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { NoAuth } from '../decorator/no-auth.decorator';
import { MailService } from './@global/mail/mail.service';

class SendMailQueryDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}

  @NoAuth()
  @Get('health')
  healthCheck() {
    return 'ok';
  }

  @NoAuth()
  @Get('test')
  test(@Query() query: SendMailQueryDto) {
    return this.mailService.send({
      subject: query.subject,
      to: [query.to],
      text: query.text,
    });
  }
}
