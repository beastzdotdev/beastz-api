import { HttpException, HttpStatus } from '@nestjs/common';
import { ImportantExceptionBody } from '../model/exception.type';

/**
 * @description This is custom exception factory like
 */
export class CustomException extends HttpException {
  constructor(message: string, statusCode: HttpStatus | number, description?: string) {
    super(
      <ImportantExceptionBody>{
        message,
        statusCode,
        description,
      },
      statusCode,
    );
  }
}
