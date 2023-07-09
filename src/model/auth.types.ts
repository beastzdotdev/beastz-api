import { PlatformForJwt } from '@prisma/client';

export type UserPayload = {
  userId: number;
  issuedAt?: number;
  expirationTime?: number;
  sub: string;
};

export type AuthTokenPayload = {
  userId: number;
  platform: PlatformForJwt;
};
