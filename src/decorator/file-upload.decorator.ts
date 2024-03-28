import { applyDecorators, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MultiFormFileToBodyParserInterceptor } from '../interceptor/multi-form-data-parser.interceptor';

export function FileUploadInterceptor(...interceptors: NestInterceptor[]) {
  return applyDecorators(
    UseInterceptors(
      AnyFilesInterceptor({
        preservePath: false,
        fileFilter(
          _req: Express.Request,
          file: Express.Multer.File,
          callback: (error: Error | null, acceptFile: boolean) => void,
        ) {
          // for non latin characters
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
          return callback(null, true);
        },
      }),
      MultiFormFileToBodyParserInterceptor,
      ...interceptors,
    ),
  );
}
