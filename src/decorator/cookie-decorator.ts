import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CookieStrict = createParamDecorator((cookieName: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const cookie = request.cookies?.[cookieName];

  if (!cookie) {
    throw new BadRequestException(`Cookie named ${cookieName} not found`);
  }

  return cookie;
});

export const Cookie = createParamDecorator((cookieName: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const cookie = request.cookies?.[cookieName];
  return cookie;
});
