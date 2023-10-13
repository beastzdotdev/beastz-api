import moment from 'moment';
import { Request } from 'express';
import { extname } from 'path';
import { Observable } from 'rxjs';
import { diskStorage } from 'multer';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { applyDecorators, CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';

function generateFileName(_: Request, file: Express.Multer.File, callback: (e: Error | null, f: string) => void) {
  const uniqueSuffix = moment().valueOf() + '-' + Math.round(Math.random() * 1e9);

  const fileExtName = extname(file.originalname);
  const fileName = `${uniqueSuffix}${fileExtName || '.jpg'}`;

  callback(null, fileName);
}

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
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
