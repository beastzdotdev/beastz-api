import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionBody, ImportantExceptionBody } from '../model/exception.type';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { EnvService } from '../modules/@global/env/env.service';
import { InjectEnv } from '../modules/@global/env/env.decorator';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    console.log(exception);

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const path = httpAdapter.getRequestUrl(ctx.getRequest());
    const isDev = this.envService.isDev();

    let errorBody: AllExceptionBody;

    if (exception instanceof HttpException) {
      const error = exception.getResponse() as ImportantExceptionBody;

      const code =
        exception.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR
          ? ExceptionMessageCode.INTERNAL_ERROR
          : error?.messageCode ?? ExceptionMessageCode.HTTP_EXCEPTION;

      errorBody = {
        code,
        status: exception.getStatus(),
        ...(isDev && { exception, path }),
      };
    } else {
      errorBody = {
        code: ExceptionMessageCode.INTERNAL_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        ...(isDev && { exception, path }),
      };
    }

    httpAdapter.reply(ctx.getResponse(), errorBody, errorBody.status);
  }
}
