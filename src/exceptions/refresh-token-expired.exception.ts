import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class RefreshTokenExpiredException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      description: 'Refresh token expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      message: ExceptionMessageCode.REFRESH_EXPIRED_TOKEN,
    };

    super(body, body.statusCode);
  }
}
