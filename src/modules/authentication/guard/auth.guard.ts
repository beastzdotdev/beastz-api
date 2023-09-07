import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { JwtUtilService } from '../../../common/modules/jwt-util/jwt-util.service';
import { Constants } from '../../../common/constants';
import { UserService } from '../../user/user.service';
import { PlatformForJwt } from '@prisma/client';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { enumValueIncludes } from '../../../common/helper';

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
    const { authorizationHeader, platformHeader } = this.validateHeaders(request);

    const accessToken = authorizationHeader.slice('Bearer '.length);

    if (!accessToken) {
      throw new ForbiddenException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const accessTokenPayload = this.jwtUtilService.getAccessTokenPayload(accessToken);
    const user = await this.userService.getByIdIncludeIdentityForGuard(accessTokenPayload.userId);

    request.user = user;

    if (user.userIdentity.isLocked) {
      throw new ForbiddenException(ExceptionMessageCode.USER_LOCKED);
    }

    if (user.userIdentity.isBlocked) {
      throw new ForbiddenException(ExceptionMessageCode.USER_BLOCKED);
    }

    await this.jwtUtilService.validateAccessToken(accessToken, {
      platform: platformHeader,
      sub: user.email,
      userId: user.id,
    });

    return true;
  }

  private validateHeaders(request: AuthPayloadAndRequest) {
    const authorizationHeader =
      <string>request.headers[Constants.AUTH_HEADER_NAME.toLowerCase()] ||
      <string>request.headers[Constants.AUTH_HEADER_NAME];
    const platformHeader = request.headers?.[Constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platformHeader) {
      throw new BadRequestException(`Header missing "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platformHeader)) {
      throw new BadRequestException(`Incorrect header "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!authorizationHeader) {
      throw new BadRequestException(
        `Incorrect header "${Constants.PLATFORM_HEADER_NAME}" or "${Constants.PLATFORM_HEADER_NAME.toLowerCase()}"`,
      );
    }

    return {
      authorizationHeader,
      platformHeader,
    };
  }
}
