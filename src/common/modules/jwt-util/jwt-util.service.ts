import * as jwt from 'jsonwebtoken';

import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { InjectEnv } from '../../../modules/@global/env/env.decorator';
import { EnvService } from '../../../modules/@global/env/env.service';
import { DecodedJwtPayload } from './jwt-util.type';
import { JwtPayload, UserPayload } from '../../../model/auth.types';

@Injectable()
export class JwtUtilService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  generateAuthenticationTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: jwt.sign(payload, this.envService.get('ACCESS_TOKEN_SECRET').toString(), {
        expiresIn: this.envService.get('ACCESS_TOKEN_EXPIRATION'),
      }),
      refreshToken: jwt.sign(payload, this.envService.get('REFRESH_TOKEN_SECRET').toString(), {
        expiresIn: this.envService.get('REFRESH_TOKEN_EXPIRATION'),
      }),
    };
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }
    try {
      jwt.verify(token, this.envService.get('REFRESH_TOKEN_SECRET'), { ignoreExpiration: false });

      return true;
    } catch (_) {}

    return false;
  }

  async validateRefreshToken(refreshToken: string): Promise<boolean> {
    if (!refreshToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    jwt.verify(refreshToken, this.envService.get('REFRESH_TOKEN_SECRET'), this.jwtVerifyError);

    return true;
  }

  async validateAccessToken(accessToken: string): Promise<boolean> {
    if (!accessToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    jwt.verify(accessToken, this.envService.get('ACCESS_TOKEN_SECRET'), this.jwtVerifyError);

    return true;
  }

  getUserPayload(token: string): UserPayload | null {
    const payload = <DecodedJwtPayload>jwt.decode(token, { json: true });

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload?.userId !== 'number' ||
      typeof payload?.iat !== 'number' ||
      typeof payload?.exp !== 'number'
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      issuedAt: payload.iat,
      expirationTime: payload.exp,
    };
  }

  userSocketPayload(socket: Socket): UserPayload {
    const token = socket.handshake?.auth?.token;
    const payload = <DecodedJwtPayload>jwt.decode(token, { json: true });

    if (!payload) {
      throw new InternalServerErrorException('Something went wrong with socket payload decode');
    }

    return {
      userId: payload?.userId,
      expirationTime: payload?.exp,
      issuedAt: payload?.iat,
    };
  }

  private jwtVerifyError(err: jwt.VerifyErrors | null) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedException(ExceptionMessageCode.EXPIRED_TOKEN);
    }

    if (err instanceof jwt.NotBeforeError) {
      throw new UnauthorizedException(ExceptionMessageCode.NOT_BEFORE_CLAIM_TOKEN);
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
    }

    if (err) {
      throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
    }
  }
}
