import * as jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../../../model/auth.types';

export type RefreshTokenPayload = jwt.JwtPayload &
  AuthTokenPayload & {
    exp: number;
    sub: string;
    iss: string;
    iat: number;
    jti: string;
  };

export type DecodedJwtPayload = RefreshTokenPayload | null;
