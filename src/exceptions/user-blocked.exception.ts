import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

/**
 * @description This error can be removed by only admin
 */
export class UserBlockedException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      description: 'User blocked, please contact support to unblock',
      statusCode: HttpStatus.FORBIDDEN,
      message: ExceptionMessageCode.USER_LOCKED,
    };

    super(body, body.statusCode);
  }
}
