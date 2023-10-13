import { AuthTokenPayload } from '../../../../model/auth.types';

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

export type AccountVerifyTokenPayload = AuthTokenPayload & {
  exp: number;
  sub: string;
  iss: string;
  iat: number;
  jti: string;
};

export type RecoverPasswordTokenPayload = AuthTokenPayload & {
  exp: number;
  sub: string;
  iss: string;
  iat: number;
  jti: string;
};

export type ResetPasswordTokenPayload = AuthTokenPayload & {
  exp: number;
  sub: string;
  iss: string;
  iat: number;
  jti: string;
};

export type ValidateAccesssTokenPayload = Required<Pick<AccessTokenPayload, 'platform' | 'sub' | 'userId'>>;
export type ValidateRefreshTokenPayload = Required<RefreshTokenPayload> & { secret: string };
export type ValidateAccountVerifyTokenPayload = Required<Pick<AccountVerifyTokenPayload, 'sub' | 'userId' | 'jti'>>;
export type ValidateRecoverPasswordTokenPayload = Required<Pick<RecoverPasswordTokenPayload, 'sub' | 'userId' | 'jti'>>;
export type ValidateResetPasswordTokenPayload = Required<Pick<ResetPasswordTokenPayload, 'sub' | 'userId' | 'jti'>>;
