import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPayloadAndRequest } from '../model/auth.types';

export const PlatformHeader = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthPayloadAndRequest>();
  return request?.platform ?? null;
});
