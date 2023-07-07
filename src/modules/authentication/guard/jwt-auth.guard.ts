import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../exceptions/exception-message-code.enum';
import { JwtUtilService } from '../../../common/modules/jwt-util/jwt-util.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwtUtilService: JwtUtilService) {}

  canActivate(context: ExecutionContext) {
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [context.getHandler(), context.getClass()]);

    if (noAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authorizationHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authorizationHeader) {
      return false;
    }

    const accessToken = authorizationHeader.slice('Bearer '.length);

    if (!accessToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    return this.jwtUtilService.validateAccessToken(accessToken);
  }
}
