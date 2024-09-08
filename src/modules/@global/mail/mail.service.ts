import { Resend } from 'resend';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { InjectEnv } from '../env/env.decorator';
import { EnvService } from '../env/env.service';
import { SendSimpleParams } from './mail.type';
import { mailConfig } from './mail.config';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;
  private from: string;

  constructor(
    @InjectEnv()
    private readonly env: EnvService,
  ) {}

  async onModuleInit() {
    this.from = this.env.get('MAIL_FROM');
    this.resend = new Resend(mailConfig(this.env));
  }

  async send(data: SendSimpleParams) {
    this.logger.debug('Sending mail... ' + JSON.stringify(data, null, 2));

    const { data: info, error } = await this.resend.emails.send({
      from: this.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
    });

    if (!info || error) {
      this.logger.debug('Error sending mail... ' + JSON.stringify({ data: info, error }, null, 2));
      throw new BadRequestException('Problem with sending email');
    }

    this.logger.debug('Finished sending mail...');
    return info.id;
  }
}
