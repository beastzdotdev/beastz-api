import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionBody, ImportantExceptionBody } from '../model/exception.type';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { EnvService } from '../modules/@global/env/env.service';
import { InjectEnv } from '../modules/@global/env/env.decorator';
import { getMessageAsExceptionMessageCode } from '../common/helper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (
      (exception instanceof HttpException && exception.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR) ||
      !(exception instanceof HttpException)
    ) {
      console.log(exception);
    }

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const isDev = this.envService.isDev();

    let errorBody: AllExceptionBody;

    if (exception instanceof HttpException) {
      const error = exception.getResponse() as ImportantExceptionBody;

      errorBody = {
        message: getMessageAsExceptionMessageCode(error),
        statusCode: error.statusCode,

        // only on dev
        ...(isDev && {
          path,
          description: error?.description ?? 'error',
          exception,
        }),
      };
    } else {
      errorBody = {
        message: ExceptionMessageCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,

        // only on dev
        ...(isDev && {
          path,
          description: 'error',
          exception,
        }),
      };
    }

    httpAdapter.reply(ctx.getResponse(), errorBody, errorBody.statusCode);
  }
}
