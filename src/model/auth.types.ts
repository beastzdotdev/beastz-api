import { PlatformForJwt } from '@prisma/client';
import { Request } from 'express';

export type UserPayload = {
  userId: number;
};

export type AuthTokenPayload = {
  userId: number;
  platform: PlatformForJwt;
};

export type AuthPayloadRequest = Request & {
  userPayload: UserPayload | null;

  userForGuard: {
    id: number;
    email: string;
    createdAt: Date;
    userIdentity: {
      id: number;
      isAccountVerified: boolean;
      isLocked: boolean;
      isBlocked: boolean;
    };
  };
};
