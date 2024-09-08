import { EnvService } from '@global/env';
import { Resend } from 'resend';

export const mailConfig = (env: EnvService): ConstructorParameters<typeof Resend>[0] => {
  return env.get('MAIL_PASSWORD');
};
