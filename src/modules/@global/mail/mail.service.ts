import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { InjectEnv } from '../env/env.decorator';
import { EnvService } from '../env/env.service';
import { SendSimpleParams } from './mail.type';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private isSandbox: boolean = false;
  private from: string;

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  async onModuleInit() {
    this.isSandbox = this.envService.get('ENABLE_MAIL_SANDBOX');

    if (this.isSandbox) {
      return;
    }

    this.from = this.envService.get('MAIL_FROM');
    this.transporter = nodemailer.createTransport(<SMTPTransport.Options>{
      host: this.envService.get('MAIL_URL'),
      port: 465,
      secure: true,
      auth: {
        user: this.envService.get('MAIL_USERNAME'),
        pass: this.envService.get('MAIL_PASSWORD'),
      },
      ignoreTLS: true,
    });

    this.logger.verbose('Verifying mail connection...');

    console.log('='.repeat(20));
    console.log(this.envService.getInstance());
    console.log(this.isSandbox);
    console.log({
      host: this.envService.get('MAIL_URL'),
      port: 465,
      secure: true,
      auth: {
        user: this.envService.get('MAIL_USERNAME'),
        pass: this.envService.get('MAIL_PASSWORD'),
      },
      ignoreTLS: true,
    });
    console.log('='.repeat(20));

    const isVerified = await this.transporter.verify();

    this.logger.verbose(
      JSON.stringify({
        isVerified,
        name: this.transporter.transporter.name,
        host: this.envService.get('MAIL_URL'),
      }),
    );
  }

  async send(data: SendSimpleParams): Promise<SMTPTransport.SentMessageInfo> {
    this.logger.debug('Sending mail...');
    this.logger.debug(JSON.stringify(data, null, 2));

    const info = await this.transporter.sendMail({
      from: this.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
    });

    this.logger.debug('Finished sending mail...');
    this.logger.debug(JSON.stringify(info, null, 2));

    return info;
  }
}
