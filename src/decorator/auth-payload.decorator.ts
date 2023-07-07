import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
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
