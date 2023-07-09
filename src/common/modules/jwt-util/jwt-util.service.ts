import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { InjectEnv } from '../../../modules/@global/env/env.decorator';
import { EnvService } from '../../../modules/@global/env/env.service';
import { DecodedJwtPayload, RefreshTokenPayload } from './jwt-util.type';
import { AuthTokenPayload, UserPayload } from '../../../model/auth.types';
import { Constants } from '../../constants';
import { PlatformForJwt } from '@prisma/client';

@Injectable()
export class JwtUtilService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  generateAuthenticationTokens(params: { userId: number; email: string }): {
    accessToken: string;
    refreshToken: string;
    refreshTokenPayload: {
      jti: string;
      exp: string;
      sub: string;
      iat: string;
      iss: string;
      platform: string;
    };
  } {
    const authTokenPayload: AuthTokenPayload = {
      userId: params.userId,
      platform: PlatformForJwt.WEB,
    };

    const accessToken = jwt.sign(authTokenPayload, this.envService.get('ACCESS_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('ACCESS_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
      issuer: Constants.JWT_ISSUER,
      subject: params.email,
    });

    const refreshToken = jwt.sign(authTokenPayload, this.envService.get('REFRESH_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('REFRESH_TOKEN_EXPIRATION'),
      algorithm: 'HS256',
      issuer: Constants.JWT_ISSUER,
      subject: params.email,
      jwtid: uuid(),
    });

    const refreshTokenPayload = <RefreshTokenPayload>jwt.decode(refreshToken, { json: true });

    //TODO rename jwt-util.type.ts all payloads to access and refresh and remove |null
    //TODO get make multiple payload methods each for access and refresh and return what they consist

    return {
      refreshTokenPayload: {
        jti: refreshTokenPayload.jti,
        exp: refreshTokenPayload.exp.toString(),
        sub: refreshTokenPayload.sub,
        iss: refreshTokenPayload.iss,
        iat: refreshTokenPayload.iat.toString(),
        platform: refreshTokenPayload.platform,
      },
      accessToken,
      refreshToken,
    };
  }

  async validateRefreshTokenBasic(token: string, options?: jwt.VerifyOptions): Promise<void> {
    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const secret = this.envService.get('REFRESH_TOKEN_SECRET');

    // Verify just for payload
    jwt.verify(token, secret, this.jwtVerifyError);
  }

  // async validateRefreshTokenFull(token: string, options?: jwt.VerifyOptions): Promise<void> {
  //   if (!token) {
  //     throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
  //   }

  //   const secret = this.envService.get('REFRESH_TOKEN_SECRET');
  //   const jwtPayload = this.getUserPayload(token);

  //   jwt.verify(
  //     token,
  //     secret,
  //     {
  //       algorithms: ['HS256'],
  //       issuer: Constants.JWT_ISSUER,
  //       subject: jwtPayload?.sub,
  //       ...options,
  //     },
  //     this.jwtVerifyError,
  //   );
  // }

  async validateAccessToken(token: string): Promise<void> {
    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const secret = this.envService.get('ACCESS_TOKEN_SECRET');

    // Verify just for payload
    jwt.verify(token, secret, this.jwtVerifyError);

    const jwtPayload = this.getUserPayload(token);

    // Verify registered claim names
    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: Constants.JWT_ISSUER,
        subject: jwtPayload?.sub,
      },
      this.jwtVerifyError,
    );
  }

  getUserPayload(token: string): UserPayload | null {
    const payload = <DecodedJwtPayload>jwt.decode(token, { json: true });

    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload?.userId !== 'number' ||
      typeof payload?.iat !== 'number' ||
      typeof payload?.exp !== 'number' ||
      !payload?.iss ||
      !payload?.sub
    ) {
      return null;
    }

    return {
      sub: payload.sub as string,
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
      sub: payload.sub as string,
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
