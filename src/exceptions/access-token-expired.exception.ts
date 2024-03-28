import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class AccessTokenExpiredException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      description: 'Access token expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      message: ExceptionMessageCode.ACCESS_EXPIRED_TOKEN,
    };

    super(body, body.statusCode);
  }
}
