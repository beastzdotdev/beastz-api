import { PlatformForJwt } from '@prisma/client';
import { RefreshTokenClaims } from '../jwt/jwt.type';

export type CreateRefreshTokenParams = {
  userId: number;
  token: string;
  platform: PlatformForJwt;
  secretKeyEncrypted: string;
} & RefreshTokenClaims;
