import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { GeneralClass } from '../model/types';

@Injectable()
export class MultiFormFileToBodyParserInterceptor implements NestInterceptor {
  constructor(private readonly cls?: GeneralClass) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request: Request = context.switchToHttp().getRequest<Request>();

    if (request.body && request.file?.fieldname) {
      const fieldname = request.file?.fieldname;

      if (!request.body[fieldname]) {
        request.body[fieldname] = request.file;
      }
    }

    if (request.body && Array.isArray(request.files) && request.files?.length) {
      for (const file of request.files) {
        const fieldname = file?.fieldname;

        if (!request.body[fieldname]) {
          request.body[fieldname] = file;
        }
      }
    }

    if (this.cls) {
      request.body = plainToInstance(this.cls, request.body);
    }

    return next.handle();
  }
}
