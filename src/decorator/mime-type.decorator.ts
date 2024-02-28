import { applyDecorators, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MultiFormFileToBodyParserInterceptor } from '../interceptor/multi-form-data-parser.interceptor';
import { GeneralClass } from '../model/types';

export function MimeTypeInterceptor(cls?: GeneralClass, ...interceptors: NestInterceptor[]) {
  return applyDecorators(
    UseInterceptors(
      AnyFilesInterceptor({
        preservePath: true,
        fileFilter(
          _req: Express.Request,
          file: Express.Multer.File,
          callback: (error: Error | null, acceptFile: boolean) => void,
        ) {
          // callback(new BadRequestException('Hello'), false);

          // Update file name
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
          callback(null, true);
        },
      }),
      new MultiFormFileToBodyParserInterceptor(cls),
      ...interceptors,
    ),
  );
}
