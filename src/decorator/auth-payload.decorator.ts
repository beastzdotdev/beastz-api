import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { AuthPayloadAndRequest, AuthPayloadType } from '../model/auth.types';

export const AuthPayload = createParamDecorator<never, ExecutionContext, AuthPayloadType>(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthPayloadAndRequest>();

    if (!request.user) {
      throw new BadRequestException(ExceptionMessageCode.MISSING_CURRENT_USER_PAYLOAD);
    }

    return request;
  },
);
