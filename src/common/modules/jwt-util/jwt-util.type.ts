import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../../model/jwt-payload.type';

export type DecodedJwtPayload = (jwt.JwtPayload & JwtPayload) | null;
