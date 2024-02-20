import { PlatformForJwt } from '@prisma/client';
import { Request } from 'express';
import { PlatformWrapper } from './platform.wrapper';

export type AuthTokenPayload = {
  userId: number;
  platform: PlatformForJwt;
};

export type AuthPayloadType = {
  platform: PlatformWrapper;
  user: {
    id: number;
    email: string;
    createdAt: Date;
    uuid: string;
    userIdentity: {
      id: number;
      isAccountVerified: boolean;
      isLocked: boolean;
      isBlocked: boolean;
    };
  };
};

export type AuthPayloadAndRequest = Request & AuthPayloadType;
