import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtHelper } from '../helper/jwt.helper';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { ExceptionMessageCode } from '../../../exceptions/exception-message-code.enum';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwtHelper: JwtHelper) {}

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

    return this.jwtHelper.validateAccessToken(accessToken);
  }
}
