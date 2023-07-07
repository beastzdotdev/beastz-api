import {
  BadRequestException,
  CallHandler,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtHelper } from '../modules/authentication/helper/jwt.helper';
import { ExceptionMessageCode } from '../exceptions/exception-message-code.enum';
import { UserPayload } from '../model/user-payload.type';

export interface AuthPayloadRequest extends Request {
  userPayload: UserPayload | null;
}

export const AuthPayload = createParamDecorator((_: never, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<AuthPayloadRequest>();

  if (!request.userPayload) {
    throw new BadRequestException(ExceptionMessageCode.MISSING_CURRENT_USER_PAYLOAD);
  }

  return request?.userPayload;
});

@Injectable()
export class AuthPayloadInterceptor implements NestInterceptor {
  constructor(private readonly jwtHelper: JwtHelper) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<AuthPayloadRequest>();

    const authorizationHeader = request.headers['authorization'] || request.headers['Authorization'];

    const jwtToken = authorizationHeader?.slice('Bearer '.length);

    if (!authorizationHeader) {
      request.userPayload = null;
      return next.handle();
    }

    if (jwtToken) {
      request.userPayload = this.jwtHelper.getUserPayload(jwtToken) ?? null;
    }

    return next.handle();
  }
}
