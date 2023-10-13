import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class RefreshTokenExpiredException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      message: 'Refresh token expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      messageCode: ExceptionMessageCode.REFRESH_EXPIRED_TOKEN,
    };

    super(body, body.statusCode);
  }
}
