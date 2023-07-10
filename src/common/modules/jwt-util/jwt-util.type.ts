import { AuthTokenPayload } from '../../../model/auth.types';

export type RefreshTokenClaims = {
  exp: number;
  sub: string;
  iss: string;
  iat: number;
  jti: string;
};

export type RefreshTokenPayload = AuthTokenPayload & RefreshTokenClaims;

export type AccessTokenPayload = AuthTokenPayload & {
  exp: number;
  sub: string;
  iss: string;
  iat: number;
};

export type ValidateAccesssTokenPayload = Required<Pick<AccessTokenPayload, 'platform' | 'sub' | 'userId'>>;
export type ValidateRefreshTokenPayload = Required<RefreshTokenPayload> & { secret: string };
