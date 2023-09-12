import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Constants } from '../../../common/constants';
import { PlatformForJwt } from '@prisma/client';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';
import { PlatformWrapper } from '../../../model/platform.wrapper';

@Injectable()
export class AuthPlatformHeaderGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthPayloadAndRequest>();
    const platform = request.headers?.[Constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platform) {
      throw new BadRequestException(`Header missing "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platform)) {
      throw new BadRequestException(`Incorrect header "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    request.platform = new PlatformWrapper(platform);

    return true;
  }
}
