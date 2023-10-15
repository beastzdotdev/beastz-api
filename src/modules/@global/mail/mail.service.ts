import FormData from 'form-data';
import Mailgun, { MailgunMessageData, MessagesSendResult } from 'mailgun.js';

import { Injectable } from '@nestjs/common';
import { IMailgunClient } from 'mailgun.js/Interfaces';
import { InjectEnv } from '../env/env.decorator';
import { EnvService } from '../env/env.service';
import { SendSimpleParams } from './mail.type';

@Injectable()
export class MailService {
  private readonly mg: IMailgunClient;
  private readonly from: string;
  private readonly domain: string;

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {
    const mailgun = new Mailgun(FormData);

    this.domain = this.envService.get('MAIL_DOMAIN');
    this.from = this.envService.get('MAIL_FROM');

    this.mg = mailgun.client({
      username: this.envService.get('MAIL_USERNAME'),
      key: this.envService.get('MAIL_API_KEY'),
      url: this.envService.get('MAIL_URL'),
    });
  }

  async sendSimple(data: SendSimpleParams): Promise<MessagesSendResult> {
    return this.mg.messages.create(this.domain, { from: this.from, ...data });
  }

  async send(data: MailgunMessageData): Promise<MessagesSendResult> {
    return this.mg.messages.create(this.domain, { from: this.from, ...data });
  }
}
