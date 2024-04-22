import { HttpExceptionBody } from '@nestjs/common';
import { ExceptionMessageCode } from './enum/exception-message-code.enum';

export type ImportantExceptionBody = HttpExceptionBody & {
  description?: string;
};

export type AllExceptionBody = {
  message: ExceptionMessageCode;
  statusCode: number;

  // only on dev enviroment
  dev?: {
    exception?: unknown;
    path?: string;
    description?: string;
  };
};
