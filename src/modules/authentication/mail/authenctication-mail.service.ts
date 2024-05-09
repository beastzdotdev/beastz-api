import { Injectable } from '@nestjs/common';
import { MailService } from '../../@global/mail/mail.service';

const messagees = {
  reuseAndStrict:
    'Security issue detected, please reset password and log out on all devices or delete all sessions (User is blocked due to strict mode, please use our unblock feature)',
  reuse: 'Security issue detected, please reset password and log out on all devices or delete all sessions',
};

@Injectable()
export class AuthenticationMailService {
  constructor(private readonly mailService: MailService) {}

  async sendReuse(emailTo: string, strict: boolean) {
    return this.mailService.send({
      subject: 'Security',
      to: [emailTo],
      text: strict ? messagees.reuseAndStrict : messagees.reuse,
    });
  }

  async sendPasswordReset(emailTo: string, url: string) {
    return this.mailService.send({
      subject: 'Security, Password reset',
      to: [emailTo],
      text: `Please verify by clicking on this url: ${url}`,
    });
  }

  async sendPasswordRecover(emailTo: string, url: string, newPasswordText: string) {
    return this.mailService.send({
      subject: 'Security, Password recover',
      to: [emailTo],
      text: `Please verify by clicking on this url: ${url}, your new password: ${newPasswordText}`,
    });
  }

  async sendAccountVerify(emailTo: string, url: string) {
    return this.mailService.send({
      subject: 'Security, Account verify',
      to: [emailTo],
      text: `Please verify by clicking on this url: ${url}`,
    });
  }
}
