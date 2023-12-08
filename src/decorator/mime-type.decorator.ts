/* eslint-disable @typescript-eslint/ban-types */
import { applyDecorators, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { MultiFormFileToBodyParserInterceptor } from '../interceptor/multi-form-data-parser.interceptor';

export function MimeTypeInterceptor(...interceptors: NestInterceptor[]) {
  return applyDecorators(UseInterceptors(AnyFilesInterceptor(), MultiFormFileToBodyParserInterceptor, ...interceptors));
}
