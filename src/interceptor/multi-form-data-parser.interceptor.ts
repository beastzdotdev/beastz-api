import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MultiFormFileToBodyParserInterceptor implements NestInterceptor {
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

    return next.handle();
  }
}
