import { SetMetadata } from '@nestjs/common';

export const NO_AUTH_KEY = 'no_auth';
export const NoAuth = () => SetMetadata(NO_AUTH_KEY, true);
