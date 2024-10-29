import { Response } from 'express';
import { PrismaTx } from '@global/prisma';
import { PlatformWrapper } from '../../model/platform.wrapper';

export type SignInParams = {
  email: string;
  password: string;
};

export type RefreshParams = {
  oldRefreshTokenString: string;
};

export type RecoverPasswordConfirmCodeParams = {
  code: number;
  email: string;
};

export type ValidateUserForAccVerifyFlags = {
  showIsVerifiedErr?: boolean;
  showNotVerifiedErr?: boolean;
};

export type GenTokensAndSendResponseParams = {
  res: Response;
  userId: number;
  email: string;
  platform: PlatformWrapper;
  isAccountVerified: boolean;
  tx?: PrismaTx;
};
