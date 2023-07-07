import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthPayloadRequest } from '../../decorator/auth-payload.decorator';
import { JwtUtilService } from '../../common/modules/jwt-util/jwt-util.service';

@Injectable()
export class AuthPayloadInterceptor implements NestInterceptor {
  constructor(private readonly jwtUtilService: JwtUtilService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthPayloadRequest>();

    const authorizationHeader = request.headers['authorization'] || request.headers['Authorization'];
    const jwtToken = <string | undefined>authorizationHeader?.slice('Bearer '.length);

    if (!authorizationHeader) {
      request.userPayload = null;
      return next.handle();
    }

    if (jwtToken) {
      request.userPayload = this.jwtUtilService.getUserPayload(jwtToken) ?? null;
    }

    return next.handle();
  }
}
