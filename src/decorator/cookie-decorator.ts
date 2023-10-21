import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { GeneralClass } from '../model/types';

export type CookieStrictParams = {
  cookieName: string;
  message?: string;
  cls?: GeneralClass;
};

export const CookieStrict = createParamDecorator((params: CookieStrictParams, ctx: ExecutionContext) => {
  const { cookieName, cls, message } = params;

  const request = ctx.switchToHttp().getRequest<Request>();
  const cookie = request.signedCookies?.[cookieName];

  const finalMessage = message ?? `Cookie named ${cookieName} not found`;
  const finalClass = cls ?? BadRequestException;

  if (!cookie) {
    throw new finalClass(finalMessage);
  }

  return cookie;
});

export const Cookie = createParamDecorator((cookieName: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const cookie = request.signedCookies?.[cookieName];
  return cookie;
});
