import path from 'path';
import { Reflector } from '@nestjs/core';
import { PlatformForJwt } from '@prisma/client';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@global/jwt';
import { InjectEnv, EnvService } from '@global/env';

import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { constants } from '../../../common/constants';
import { UserService } from '../../user/user.service';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';
import { PlatformWrapper } from '../../../model/platform.wrapper';
import { UserBlockedException } from '../../../exceptions/user-blocked.exception';
import { UserLockedException } from '../../../exceptions/user-locked.exception';
import { encryption } from '../../../common/encryption';
import { AccessTokenExpiredException } from '../../../exceptions/access-token-expired.exception';
import { TokenExpiredException } from '../../../exceptions/token-expired-forbidden.exception';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,

    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [context.getHandler(), context.getClass()]);

    if (noAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthPayloadAndRequest>();

    const { authorizationHeader, platform } = this.validateHeaders(request);

    let accessToken: string | undefined;

    if (platform.isWeb()) {
      accessToken = request.signedCookies[constants.COOKIE_ACCESS_NAME];
    }

    if (platform.isMobile()) {
      accessToken = authorizationHeader.slice('Bearer '.length);
    }

    if (!accessToken) {
      throw new ForbiddenException(ExceptionMessageCode.MISSING_TOKEN);
    }

    // Decrypt is session is enabled
    const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');
    const key = this.envService.get('SESSION_JWT_ENCRYPTION_KEY');

    const finalAccessToken = isEncryptionSessionActive
      ? await encryption.aes256gcm.decrypt(accessToken, key)
      : accessToken;

    if (!finalAccessToken) {
      throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
    }

    const accessTokenPayload = this.jwtService.getAccessTokenPayload(finalAccessToken);
    const user = await this.userService.getByIdIncludeIdentity(accessTokenPayload.userId);

    if (user.userIdentity.isBlocked) {
      throw new UserBlockedException();
    }

    if (user.userIdentity.isLocked) {
      throw new UserLockedException();
    }

    try {
      await this.jwtService.validateAccessToken(finalAccessToken, {
        platform: platform.getPlatform(),
        sub: user.email,
        userId: user.id,
      });
    } catch (error) {
      // catch general token expired error, update is used if access token is correct and expired
      if (error instanceof TokenExpiredException) {
        throw new AccessTokenExpiredException();
      }

      throw error;
    }

    request.user = user;
    request.platform = platform;

    return true;
  }

  private validateHeaders(request: AuthPayloadAndRequest) {
    const authorizationHeader =
      <string>request.headers[constants.AUTH_HEADER_NAME.toLowerCase()] ||
      <string>request.headers[constants.AUTH_HEADER_NAME];
    let platformValue = request.headers?.[constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    //TODO needs some check for example can be moved to hub
    if (
      request.url.startsWith(path.join('/', constants.assets.userContentFolderName)) ||
      request.url.startsWith(path.join('/', constants.assets.userUploadFolderName)) ||
      request.url.startsWith(path.join('/', constants.assets.userBinFolderName)) ||
      request.url.startsWith(path.join('/', constants.assets.hubFolderName))
    ) {
      platformValue = PlatformForJwt.WEB;
    }

    if (!platformValue) {
      throw new BadRequestException(`Header missing "${constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platformValue)) {
      throw new BadRequestException(`Missing header/value "${constants.PLATFORM_HEADER_NAME}"`);
    }

    const platform = new PlatformWrapper(platformValue);

    if (platform.isMobile() && !authorizationHeader) {
      throw new UnauthorizedException(
        `Missing header/value "${constants.AUTH_HEADER_NAME}" or "${constants.AUTH_HEADER_NAME.toLowerCase()}"`,
      );
    }

    return {
      authorizationHeader,
      platform: new PlatformWrapper(platformValue),
    };
  }
}
