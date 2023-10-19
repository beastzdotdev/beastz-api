import moment from 'moment';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionBody, ImportantExceptionBody } from '../model/exception.type';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    console.log(exception);

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorBody: AllExceptionBody;

    if (exception instanceof HttpException) {
      const error = exception as unknown as ImportantExceptionBody;
      const errorResponse = exception.getResponse() as unknown as ImportantExceptionBody;

      errorBody = {
        message: error.message,
        messageCode: error?.messageCode ?? ExceptionMessageCode.HTTP_EXCEPTION,
        error: errorResponse.error ?? 'Internal error',
        statusCode: httpStatus,
        path: httpAdapter.getRequestUrl(ctx.getRequest()),
        timestamp: moment().toISOString(),
      };
    } else {
      errorBody = {
        message: 'Something went wrong',
        messageCode: ExceptionMessageCode.INTERNAL_ERROR,
        error: 'Internal error',
        statusCode: httpStatus,
        path: httpAdapter.getRequestUrl(ctx.getRequest()),
        timestamp: moment().toISOString(),
      };
    }

    httpAdapter.reply(ctx.getResponse(), errorBody, httpStatus);
  }
}
