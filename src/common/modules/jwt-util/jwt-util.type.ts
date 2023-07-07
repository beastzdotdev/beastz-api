import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../../model/auth.types';

export type DecodedJwtPayload = (jwt.JwtPayload & JwtPayload) | null;
