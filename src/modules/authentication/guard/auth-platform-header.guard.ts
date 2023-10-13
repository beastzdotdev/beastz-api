import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PlatformForJwt } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { constants } from '../../../common/constants';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';
import { PlatformWrapper } from '../../../model/platform.wrapper';
import { NO_PLATFORM_HEADER } from '../../../decorator/no-platform-header.decorator';

@Injectable()
export class AuthPlatformHeaderGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const noPlatformHeader = this.reflector.getAllAndOverride<boolean>(NO_PLATFORM_HEADER, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (noPlatformHeader) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthPayloadAndRequest>();
    const platform = request.headers?.[constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platform) {
      throw new ForbiddenException(`Header missing "${constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platform)) {
      throw new ForbiddenException(`Incorrect header "${constants.PLATFORM_HEADER_NAME}"`);
    }

    request.platform = new PlatformWrapper(platform);

    return true;
  }
}
