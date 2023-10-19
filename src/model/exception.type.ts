import { HttpExceptionBody } from '@nestjs/common';
import { ExceptionMessageCode } from './enum/exception-message-code.enum';

export type ImportantExceptionBody = HttpExceptionBody & {
  messageCode?: ExceptionMessageCode;
};

export type AllExceptionBody = ImportantExceptionBody & {
  statusCode: number;
  timestamp: string;
  path: string;
};
