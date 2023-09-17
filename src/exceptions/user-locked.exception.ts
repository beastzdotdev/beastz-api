import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

/**
 * @description This error can be removed by only admin
 */
export class UserLockedException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      message: 'User locked, please use our unblock feature and figure out reason',
      statusCode: HttpStatus.FORBIDDEN,
      messageCode: ExceptionMessageCode.USER_LOCKED,
    };

    super(body, body.statusCode);
  }
}