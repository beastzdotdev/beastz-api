import { Gender } from '@prisma/client';

export type SignUpWithTokenParams = {
  userName: string;
  email: string;
  gender: Gender;
  birthDate: Date;
  password: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type RecoverPasswordConfirmCodeParams = {
  code: number;
  email: string;
};

export type RecoverPasswordParams = {
  uuid: string;
  password: string;
};
