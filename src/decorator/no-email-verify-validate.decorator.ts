import { SetMetadata } from '@nestjs/common';

export const NO_EMAIL_VERIFY_VALIDATE = 'no_email_verify_validate';
export const NoEmailVerifyValidate = () => SetMetadata(NO_EMAIL_VERIFY_VALIDATE, true);
