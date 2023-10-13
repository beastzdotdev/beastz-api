import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { JwtUtilService } from '../modules/jwt/jwt-util.service';
import { constants } from '../../../common/constants';
import { UserService } from '../../user/user.service';
import { PlatformForJwt } from '@prisma/client';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';
import { PlatformWrapper } from '../../../model/platform.wrapper';
import { UserBlockedException } from '../../../exceptions/user-blocked.exception';
import { UserLockedException } from '../../../exceptions/user-locked.exception';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtUtilService: JwtUtilService,
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
      accessToken = request.cookies[constants.COOKIE_ACCESS_NAME];
    }

    if (platform.isMobile()) {
      accessToken = authorizationHeader.slice('Bearer '.length);
    }

    if (!accessToken) {
      throw new ForbiddenException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const accessTokenPayload = this.jwtUtilService.getAccessTokenPayload(accessToken);
    const user = await this.userService.getByIdIncludeIdentityForGuard(accessTokenPayload.userId);

    if (user.userIdentity.isBlocked) {
      throw new UserBlockedException();
    }

    if (user.userIdentity.isLocked) {
      throw new UserLockedException();
    }

    await this.jwtUtilService.validateAccessToken(accessToken, {
      platform: platform.getPlatform(),
      sub: user.email,
      userId: user.id,
    });

    request.user = user;
    request.platform = platform;

    return true;
  }

  private validateHeaders(request: AuthPayloadAndRequest) {
    const authorizationHeader =
      <string>request.headers[constants.AUTH_HEADER_NAME.toLowerCase()] ||
      <string>request.headers[constants.AUTH_HEADER_NAME];
    const platform = request.headers?.[constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platform) {
      throw new BadRequestException(`Header missing "${constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platform)) {
      throw new BadRequestException(`Incorrect header "${constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!authorizationHeader) {
      throw new UnauthorizedException(
        `Incorrect header "${constants.AUTH_HEADER_NAME}" or "${constants.AUTH_HEADER_NAME.toLowerCase()}"`,
      );
    }

    return {
      authorizationHeader,
      platform: new PlatformWrapper(platform),
    };
  }
}
