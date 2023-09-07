import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';

export class TokenExpiredException extends HttpException {
  constructor() {
    super(ExceptionMessageCode.EXPIRED_TOKEN, HttpStatus.FORBIDDEN);
  }
}
