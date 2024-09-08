import path from 'path';
import { Request } from 'express';
import { HttpAdapterHost } from '@nestjs/core';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { EnvService, InjectEnv } from '@global/env';

import { AllExceptionBody, ImportantExceptionBody } from '../model/exception.type';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { getMessageAsExceptionMessageCode } from '../common/helper';
import { constants } from '../common/constants';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // console.log(exception);

    if (
      (exception instanceof HttpException && exception.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR) ||
      !(exception instanceof HttpException)
    ) {
      this.logger.debug(exception);
    }

    const ctx = host.switchToHttp();
    const url = ctx.getRequest<Request>().url;

    const isDev = this.envService.isDev();

    let errorBody: AllExceptionBody;

    // console.log(url);

    //TODO needs some check for example can be moved to hub
    if (
      url.startsWith(path.join('/', constants.assets.userContentFolderName)) ||
      url.startsWith(path.join('/', constants.assets.userUploadFolderName)) ||
      url.startsWith(path.join('/', constants.assets.userBinFolderName))
    ) {
      errorBody = {
        message: ExceptionMessageCode.ASSET_ERROR,
        statusCode: HttpStatus.BAD_REQUEST,

        // only on dev
        ...(isDev && {
          dev: {
            path: url,
            description: 'Invalid url for user content',
            exception,
          },
        }),
      };
    } else if (exception instanceof HttpException) {
      const error = exception.getResponse() as ImportantExceptionBody;

      errorBody = {
        message: getMessageAsExceptionMessageCode(error),
        statusCode: error.statusCode,

        // only on dev
        ...(isDev && {
          dev: {
            path: url,
            description: error?.description ?? 'error',
            exception,
          },
        }),
      };
    } else {
      errorBody = {
        message: ExceptionMessageCode.INTERNAL_ERROR,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,

        // only on dev
        ...(isDev && {
          dev: {
            path: url,
            description: 'error',
            exception,
          },
        }),
      };
    }

    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    this.httpAdapterHost.httpAdapter.reply(ctx.getResponse(), errorBody, errorBody.statusCode);
  }
}
