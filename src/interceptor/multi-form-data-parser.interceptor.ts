import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class MultiFormFileToBodyParserInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request: Request = context.switchToHttp().getRequest<Request>();

    if (!request.body) {
      return next.handle();
    }

    if (request.file && !request.body[request.file.fieldname]) {
      request.body[request.file.fieldname] = request.file;
    }

    const files = request.files as Express.Multer.File[];

    if (!files || !files.length) {
      return next.handle();
    }

    if (files.length === 1) {
      if (!request.body[files[0].fieldname]) {
        request.body[files[0].fieldname] = files[0];
      }
    } else {
      for (const file of files) {
        if (!request.body[file.fieldname]) {
          request.body[file.fieldname] = [file];
          continue;
        }

        request.body[file.fieldname].push(file);
      }
    }

    return next.handle();
  }
}
