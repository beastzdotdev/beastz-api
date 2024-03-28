import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthResponseErrorViewJsonParams } from '../../../model/types';
import { ImportantExceptionBody } from '../../../model/exception.type';
import { getMessageAsExceptionMessageCode } from '../../../common/helper';

@Catch()
export class AuthConfirmResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthConfirmResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    this.logger.error('='.repeat(50));
    this.logger.error(exception);
    this.logger.error('Error body', exception instanceof HttpException ? exception.getResponse() : 'Non http error');
    this.logger.error('Query parameters', req.query);
    this.logger.error('='.repeat(50));

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const error = exception.getResponse() as ImportantExceptionBody;

      return res.status(HttpStatus.OK).render('view/auth-response-error', <AuthResponseErrorViewJsonParams>{
        text:
          status === HttpStatus.INTERNAL_SERVER_ERROR
            ? 'Something went wrong'
            : getMessageAsExceptionMessageCode(error),
        pageTabTitle: 'Error',
      });
    }

    return res.status(HttpStatus.OK).render('view/auth-response-error', <AuthResponseErrorViewJsonParams>{
      text: 'Something went wrong',
      pageTabTitle: 'Error',
    });
  }
}
