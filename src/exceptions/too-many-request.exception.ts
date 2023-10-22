import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class TooManyRequestException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      description: 'Too many requests',
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: ExceptionMessageCode.TOO_MANY_REQUESTS,
    };

    super(body, body.statusCode);
  }
}
