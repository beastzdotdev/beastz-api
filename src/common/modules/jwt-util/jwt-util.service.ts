import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { isObject } from '@nestjs/class-validator';
import { PlatformForJwt } from '@prisma/client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { InjectEnv } from '../../../modules/@global/env/env.decorator';
import { EnvService } from '../../../modules/@global/env/env.service';
import { AuthTokenPayload } from '../../../model/auth.types';
import { Constants } from '../../constants';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  ValidateAccesssTokenPayload,
  ValidateRefreshTokenPayload,
} from './jwt-util.type';

@Injectable()
export class JwtUtilService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  async validateAccessToken(token: string, validateOptions: ValidateAccesssTokenPayload): Promise<void> {
    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const secret = this.envService.get('ACCESS_TOKEN_SECRET');

    const accessTokenPayload = this.getAccessTokenPayload(token);

    const { platform, sub, userId } = validateOptions;

    if (accessTokenPayload.platform !== platform) {
      throw new UnauthorizedException('jwt platform not accurate');
    }

    if (accessTokenPayload.userId !== userId) {
      throw new UnauthorizedException('jwt userId not accurate');
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: Constants.JWT_ISSUER,
        subject: sub,
      },
      this.jwtVerifyError,
    );
  }

  async validateRefreshToken(token: string, validateOptions: ValidateRefreshTokenPayload): Promise<void> {
    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const { secret } = validateOptions;
    const refreshTokenPayload = this.getRefreshTokenPayload(token);

    const { exp, iat, iss, jti, platform, sub, userId } = validateOptions;

    if (refreshTokenPayload.exp !== exp) {
      throw new UnauthorizedException('jwt exp not accurate');
    }

    if (refreshTokenPayload.iat !== iat) {
      throw new UnauthorizedException('jwt iat not accurate');
    }

    if (refreshTokenPayload.platform !== platform) {
      throw new UnauthorizedException('jwt platform not accurate');
    }

    if (refreshTokenPayload.userId !== userId) {
      throw new UnauthorizedException('jwt platform not accurate');
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: iss,
        jwtid: jti,
        subject: sub,
      },
      this.jwtVerifyError,
    );
  }

  async validateRefreshTokenBasic(token: string, validateOptions: ValidateRefreshTokenPayload): Promise<void> {
    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const { secret } = validateOptions;
    const refreshTokenPayload = this.getRefreshTokenPayload(token);

    const { exp, iat, iss, jti, platform, sub, userId } = validateOptions;

    if (refreshTokenPayload.exp !== exp) {
      throw new UnauthorizedException('jwt exp not accurate');
    }

    if (refreshTokenPayload.iat !== iat) {
      throw new UnauthorizedException('jwt iat not accurate');
    }

    if (refreshTokenPayload.platform !== platform) {
      throw new UnauthorizedException('jwt platform not accurate');
    }

    if (refreshTokenPayload.userId !== userId) {
      throw new UnauthorizedException('jwt platform not accurate');
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: iss,
        jwtid: jti,
        subject: sub,
      },
      this.jwtVerifyError,
    );
  }

  genAccessToken(params: { userId: number; email: string }): string {
    const authTokenPayload: AuthTokenPayload = {
      userId: params.userId,
      platform: PlatformForJwt.WEB,
    };

    return jwt.sign(authTokenPayload, this.envService.get('ACCESS_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('ACCESS_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
      issuer: Constants.JWT_ISSUER,
      subject: params.email,
    });
  }

  genRefreshToken(params: { userId: number; email: string; refreshKeySecret: string }): string {
    const authTokenPayload: AuthTokenPayload = {
      userId: params.userId,
      platform: PlatformForJwt.WEB,
    };

    return jwt.sign(authTokenPayload, params.refreshKeySecret, {
      expiresIn: this.envService.get('REFRESH_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
      issuer: Constants.JWT_ISSUER,
      subject: params.email,
      jwtid: uuid(),
    });
  }

  getAccessTokenPayload(token: string): AccessTokenPayload {
    const payload = <AccessTokenPayload>jwt.decode(token, { json: true });

    if (
      !isObject(payload) ||
      !payload.platform ||
      !payload.userId ||
      !payload.exp ||
      !payload.sub ||
      !payload.iss ||
      !payload.iat
    ) {
      throw new UnauthorizedException('jwt invalid payload');
    }

    return payload;
  }

  getRefreshTokenPayload(token: string): RefreshTokenPayload {
    const payload = <RefreshTokenPayload>jwt.decode(token, { json: true });

    // claims
    if (
      !isObject(payload) ||
      !payload.platform ||
      !payload.userId ||
      !payload.exp ||
      !payload.sub ||
      !payload.iss ||
      !payload.iat ||
      !payload.iat
    ) {
      throw new UnauthorizedException('jwt invalid payload');
    }

    return payload;
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
