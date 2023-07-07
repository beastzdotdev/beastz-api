import { applyDecorators, CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Observable } from 'rxjs';
import { generateFileName } from '../common/helper';

export const ApiFile = (fieldName: string) => {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        storage: diskStorage({
          filename: generateFileName,
        }),
      }),
      FileToBodyInterceptor,
    ),
  );
};

export const ApiFiles = (fieldName: string) => {
  return applyDecorators(
    UseInterceptors(
      FilesInterceptor(fieldName, undefined, {
        storage: diskStorage({
          filename: generateFileName,
        }),
      }),
      FileToBodyInterceptor,
    ),
  );
};

class FileToBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    if (req.body && req.file?.fieldname) {
      const { fieldname } = req.file;

      if (!req.body[fieldname]) {
        req.body[fieldname] = req.file;
      }
    }

    if (req.body && req.files?.length && Array.isArray(req.files)) {
      const { fieldname } = req.files[0];

      if (!req.body[fieldname]) {
        req.body[fieldname] = req.files;
      }
    }

    return next.handle();
  }
}
