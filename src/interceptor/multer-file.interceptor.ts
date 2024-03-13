import sanitizeHtml from 'sanitize-html';
import sanitizeFileName from 'sanitize-filename';
import { Request } from 'express';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { isMulterFile } from '../common/helper';

@Injectable()
export class MulterFileInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MulterFileInterceptor.name);
  private readonly maxSize?: number;
  private readonly fileTypes?: string[];

  constructor(validateParams?: { maxSize?: number; fileTypes?: string[] }) {
    this.maxSize = validateParams?.maxSize;
    this.fileTypes = validateParams?.fileTypes;
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request: Request = context.switchToHttp().getRequest<Request>();

    if (request.file?.fieldname) {
      this.validateFile(request.file);
    }

    if (request.body && Array.isArray(request.files) && request.files?.length) {
      for (const file of request.files) {
        this.validateFile(file);
      }
    }

    return next.handle();
  }

  validateFile(value: unknown) {
    // validate if multer file instance (default)
    if (!isMulterFile(value)) {
      this.logger.debug(`Must be a file ${value}`);
      throw new BadRequestException('Must be a file');
    }

    // validate file name
    if (
      value.originalname !== sanitizeHtml(value.originalname) ||
      value.originalname !== sanitizeFileName(value.originalname)
    ) {
      this.logger.debug(`Invalid file name ${value.originalname}, ${value.originalname}`);
      throw new BadRequestException('Invalid file name');
    }

    if (this.fileTypes !== undefined) {
      if (!this.fileTypes.length) {
        throw new Error('You forgot to add file types');
      }

      if (this.fileTypes.length === 1 && !!value.mimetype.match(this.fileTypes[0])) {
        this.logger.debug(`File mime type not accepted ${value.mimetype}, ${value.originalname}`);
        throw new BadRequestException('File mime type not accepted');
      }

      if (!this.fileTypes.includes(value.mimetype)) {
        this.logger.debug(`File mime type not accepted ${value.mimetype}, ${value.originalname}`);
        throw new BadRequestException('File mime type not accepted');
      }
    }

    if (this.maxSize !== undefined) {
      if (this.maxSize <= 0) {
        throw new Error(`Max size less than 0 ${this.maxSize} provided, ${value.originalname}`);
      }

      if (value.size > this.maxSize) {
        this.logger.debug(`File size not accepted ${value.size}, ${value.originalname}`);
        throw new BadRequestException('File size not accepted');
      }
    }
  }
}
