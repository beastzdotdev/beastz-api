import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export class UserNotVerifiedException extends HttpException {
  constructor() {
    const body: ImportantExceptionBody = {
      description: 'User not verified, please confirm account',
      statusCode: HttpStatus.FORBIDDEN,
      message: ExceptionMessageCode.USER_NOT_VERIFIED,
    };

    super(body, body.statusCode);
  }
}
