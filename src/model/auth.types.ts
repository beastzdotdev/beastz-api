import { PlatformForJwt } from '@prisma/client';
import { Request } from 'express';
import { type } from 'os';

export type AuthTokenPayload = {
  userId: number;
  platform: PlatformForJwt;
};

export type AuthPayloadType = {
  user: {
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

export type AuthPayloadAndRequest = Request & AuthPayloadType;
