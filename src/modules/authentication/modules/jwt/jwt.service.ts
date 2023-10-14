import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { isObject } from '@nestjs/class-validator';
import { PlatformForJwt } from '@prisma/client';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { InjectEnv } from '../../../@global/env/env.decorator';
import { EnvService } from '../../../@global/env/env.service';
import { AuthTokenPayload } from '../../../../model/auth.types';
import { constants } from '../../../../common/constants';
import { TokenExpiredException } from '../../../../exceptions/token-expired-forbidden.exception';
import { promisify } from '../../../../common/helper';
import {
  AccessTokenPayload,
  AccountVerifyTokenPayload,
  RecoverPasswordTokenPayload,
  RefreshTokenPayload,
  ResetPasswordTokenPayload,
  ValidateAccesssTokenPayload,
  ValidateAccountVerifyTokenPayload,
  ValidateRecoverPasswordTokenPayload,
  ValidateRefreshTokenPayload,
  ValidateResetPasswordTokenPayload,
} from './jwt.type';

@Injectable()
export class JwtService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  async validateAccessToken(token: string, validateOptions: ValidateAccesssTokenPayload) {
    const secret = this.envService.get('ACCESS_TOKEN_SECRET');
    const accessTokenPayload = this.getAccessTokenPayload(token);

    const { platform, sub, userId } = validateOptions;

    if (accessTokenPayload.platform !== platform) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PLATFORM);
    }

    if (accessTokenPayload.userId !== userId) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_USERID);
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: constants.JWT_ISSUER,
        subject: sub,
      },
      this.jwtVerifyError,
    );
  }

  async validateRefreshToken(token: string, validateOptions: ValidateRefreshTokenPayload) {
    const secret = this.envService.get('REFRESH_TOKEN_SECRET');
    const refreshTokenPayload = this.getRefreshTokenPayload(token);

    const { exp, iat, iss, jti, platform, sub, userId } = validateOptions;

    if (refreshTokenPayload.exp !== exp) {
      throw new ForbiddenException('jwt exp not accurate');
    }

    if (refreshTokenPayload.iat !== iat) {
      throw new ForbiddenException('jwt iat not accurate');
    }

    if (refreshTokenPayload.platform !== platform) {
      throw new ForbiddenException('jwt platform not accurate');
    }

    if (refreshTokenPayload.userId !== userId) {
      throw new ForbiddenException('jwt platform not accurate');
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

  async validateRefreshTokenSignatureOnly(token: string) {
    const secret = this.envService.get('REFRESH_TOKEN_SECRET');

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
      },
      this.jwtVerifyError,
    );
  }

  async validateAccountVerifyToken(token: string, validateOptions: ValidateAccountVerifyTokenPayload) {
    const secret = this.envService.get('ACCOUNT_VERIFY_TOKEN_SECRET');
    const tokenPayload = this.getAccountVerifyTokenPayload(token);

    const { sub, userId, jti } = validateOptions;

    if (tokenPayload.userId !== userId) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_USERID);
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: constants.JWT_ISSUER,
        subject: sub,
        jwtid: jti,
      },
      err => {
        if (err instanceof jwt.TokenExpiredError) {
          throw new ForbiddenException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_TIMED_OUT);
        }

        this.jwtVerifyError(err);
      },
    );
  }

  async validateRecoverPasswordToken(token: string, validateOptions: ValidateRecoverPasswordTokenPayload) {
    const secret = this.envService.get('RECOVER_PASSWORD_TOKEN_SECRET');
    const tokenPayload = this.getRecoverPasswordTokenPayload(token);

    const { sub, userId, jti } = validateOptions;

    if (tokenPayload.userId !== userId) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_USERID);
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: constants.JWT_ISSUER,
        subject: sub,
        jwtid: jti,
      },
      err => {
        if (err instanceof jwt.TokenExpiredError) {
          throw new ForbiddenException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_TIMED_OUT);
        }

        this.jwtVerifyError(err);
      },
    );
  }

  async validateResetPasswordToken(token: string, validateOptions: ValidateResetPasswordTokenPayload) {
    const secret = this.envService.get('RESET_PASSWORD_TOKEN_SECRET');
    const tokenPayload = this.getResetPasswordTokenPayload(token);

    const { sub, userId, jti } = validateOptions;

    if (tokenPayload.userId !== userId) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_USERID);
    }

    jwt.verify(
      token,
      secret,
      {
        algorithms: ['HS256'],
        issuer: constants.JWT_ISSUER,
        subject: sub,
        jwtid: jti,
      },
      err => {
        if (err instanceof jwt.TokenExpiredError) {
          throw new ForbiddenException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_TIMED_OUT);
        }

        this.jwtVerifyError(err);
      },
    );
  }

  async genAccessToken(params: { userId: number; email: string }): Promise<string> {
    const authTokenPayload: AuthTokenPayload = {
      userId: params.userId,
      platform: PlatformForJwt.WEB,
    };

    return promisify(() =>
      jwt.sign(authTokenPayload, this.envService.get('ACCESS_TOKEN_SECRET'), {
        expiresIn: this.envService.get('ACCESS_TOKEN_EXPIRATION_IN_SEC'),
        algorithm: 'HS256',
        issuer: constants.JWT_ISSUER,
        subject: params.email,
      }),
    );
  }

  async genRefreshToken(params: { userId: number; email: string }): Promise<string> {
    const authTokenPayload: AuthTokenPayload = {
      userId: params.userId,
      platform: PlatformForJwt.WEB,
    };

    return promisify(() =>
      jwt.sign(authTokenPayload, this.envService.get('REFRESH_TOKEN_SECRET'), {
        expiresIn: this.envService.get('REFRESH_TOKEN_EXPIRATION_IN_SEC'),
        algorithm: 'HS256',
        issuer: constants.JWT_ISSUER,
        subject: params.email,
        jwtid: uuid(),
      }),
    );
  }

  genAccountVerifyToken(params: { userId: number; email: string; jti: string }) {
    const tokenPayload: { userId: number } = {
      userId: params.userId,
    };

    return jwt.sign(tokenPayload, this.envService.get('ACCOUNT_VERIFY_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('ACCOUNT_VERIFICATION_TOKEN_EXPIRATION_IN_SEC'),
      algorithm: 'HS256',
      issuer: constants.JWT_ISSUER,
      subject: params.email,
      jwtid: params.jti,
    });
  }

  genRecoverPasswordToken(params: { userId: number; email: string; jti: string }) {
    const tokenPayload: { userId: number } = {
      userId: params.userId,
    };

    return jwt.sign(tokenPayload, this.envService.get('RECOVER_PASSWORD_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('RECOVER_PASSWORD_REQUEST_TIMEOUT_IN_SEC'),
      algorithm: 'HS256',
      issuer: constants.JWT_ISSUER,
      subject: params.email,
      jwtid: params.jti,
    });
  }

  genResetPasswordToken(params: { userId: number; email: string; jti: string }) {
    const tokenPayload: { userId: number } = {
      userId: params.userId,
    };

    return jwt.sign(tokenPayload, this.envService.get('RESET_PASSWORD_TOKEN_SECRET').toString(), {
      expiresIn: this.envService.get('RESET_PASSWORD_REQUEST_TIMEOUT_IN_SEC'),
      algorithm: 'HS256',
      issuer: constants.JWT_ISSUER,
      subject: params.email,
      jwtid: params.jti,
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
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PAYLOAD);
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
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PAYLOAD);
    }

    return payload;
  }

  getAccountVerifyTokenPayload(token: string): AccountVerifyTokenPayload {
    const payload = <AccountVerifyTokenPayload>jwt.decode(token, { json: true });

    if (
      !isObject(payload) ||
      !payload.userId ||
      !payload.exp ||
      !payload.sub ||
      !payload.jti ||
      !payload.iss ||
      !payload.iat
    ) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PAYLOAD);
    }

    return payload;
  }

  getRecoverPasswordTokenPayload(token: string): RecoverPasswordTokenPayload {
    const payload = <RecoverPasswordTokenPayload>jwt.decode(token, { json: true });

    if (
      !isObject(payload) ||
      !payload.userId ||
      !payload.exp ||
      !payload.sub ||
      !payload.jti ||
      !payload.iss ||
      !payload.iat
    ) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PAYLOAD);
    }

    return payload;
  }

  getResetPasswordTokenPayload(token: string): ResetPasswordTokenPayload {
    const payload = <ResetPasswordTokenPayload>jwt.decode(token, { json: true });

    if (
      !isObject(payload) ||
      !payload.userId ||
      !payload.exp ||
      !payload.sub ||
      !payload.jti ||
      !payload.iss ||
      !payload.iat
    ) {
      throw new ForbiddenException(ExceptionMessageCode.JWT_INVALID_PAYLOAD);
    }

    return payload;
  }

  private jwtVerifyError(err: jwt.VerifyErrors | null) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredException();
    }

    if (err instanceof jwt.NotBeforeError) {
      throw new ForbiddenException(ExceptionMessageCode.NOT_BEFORE_CLAIM_TOKEN);
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new ForbiddenException(ExceptionMessageCode.INVALID_TOKEN);
    }

    if (err) {
      throw new ForbiddenException(ExceptionMessageCode.INVALID_TOKEN);
    }
  }
}
