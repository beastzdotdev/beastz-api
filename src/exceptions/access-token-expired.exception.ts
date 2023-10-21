import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class AccessTokenExpiredException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      message: 'Access token expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      messageCode: ExceptionMessageCode.ACCESS_EXPIRED_TOKEN,
    };

    super(body, body.statusCode);
  }
}
