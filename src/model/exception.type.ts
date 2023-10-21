import { HttpExceptionBody } from '@nestjs/common';
import { ExceptionMessageCode } from './enum/exception-message-code.enum';

export type ImportantExceptionBody = HttpExceptionBody & {
  messageCode?: ExceptionMessageCode;
};

export type AllExceptionBody = {
  code: ExceptionMessageCode;
  status: number;

  // only on dev enviroment
  exception?: unknown;
  path?: string;
};
