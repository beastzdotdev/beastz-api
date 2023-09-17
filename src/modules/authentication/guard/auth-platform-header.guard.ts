import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Constants } from '../../../common/constants';
import { PlatformForJwt } from '@prisma/client';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';
import { PlatformWrapper } from '../../../model/platform.wrapper';
import { Reflector } from '@nestjs/core';
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
    const platform = request.headers?.[Constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platform) {
      throw new ForbiddenException(`Header missing "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platform)) {
      throw new ForbiddenException(`Incorrect header "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    request.platform = new PlatformWrapper(platform);

    return true;
  }
}
