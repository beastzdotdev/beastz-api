import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { GeneralClass } from '../model/types';

@Injectable()
export class PlainToInstanceInterceptor implements NestInterceptor {
  private readonly cls: GeneralClass;

  constructor(cls: GeneralClass) {
    this.cls = cls;
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request: Request = context.switchToHttp().getRequest<Request>();

    request.body = plainToInstance(this.cls, request.body);

    return next.handle();
  }
}
