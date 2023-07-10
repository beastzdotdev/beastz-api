import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../model/enum/exception-message-code.enum';
import { JwtUtilService } from '../../../common/modules/jwt-util/jwt-util.service';
import { Constants } from '../../../common/constants';
import { UserService } from '../../user/user.service';
import { PlatformForJwt } from '@prisma/client';
import { AuthPayloadRequest } from '../../../model/auth.types';

@Injectable()
export class JwtHttpAuthGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest<AuthPayloadRequest>();

    const authorizationHeader = request.headers['authorization'] || (request.headers['Authorization'] as string);
    const platform = request.headers[Constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platform) {
      throw new BadRequestException(`Header missing "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!Object.values(PlatformForJwt).includes(platform)) {
      throw new BadRequestException(`Incorrect header "${Constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!authorizationHeader) {
      request.userPayload = null;
      return false;
    }

    const accessToken = authorizationHeader.slice('Bearer '.length);

    if (!accessToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const accessTokenPayload = this.jwtUtilService.getAccessTokenPayload(accessToken);
    const user = await this.userService.getById(accessTokenPayload.userId);

    await this.jwtUtilService.validateAccessToken(accessToken, {
      platform,
      sub: user.email,
      userId: user.id,
    });

    // add to request
    request.userPayload = { userId: accessTokenPayload.userId } ?? null;

    return true;
  }
}
