import path from 'path';
import { Request, Response } from 'express';
import { HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AuthPayloadType } from '../model/auth.types';
import { AllExceptionBody } from '../model/exception.type';
import { AppController } from './app.controller';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppController.name);

  async serveStaticProtected(req: Request, res: Response, authPayload: AuthPayloadType, startingAbsPath: string) {
    try {
      const subPath = req.params[0];

      if (!subPath) {
        throw new Error('Panic');
      }

      const finalPath = path.join(startingAbsPath, authPayload.user.uuid, subPath);

      console.log(finalPath);

      res.sendFile(
        finalPath,
        {
          cacheControl: true,
          index: false,
          headers: {
            'Cache-Control': 'Must-Revalidate',
          },
        },
        error => {
          if (error !== undefined) {
            const exception = new NotFoundException('File not found');

            this.logger.debug('res.sendFile');
            this.logger.debug(error);

            if (!res.headersSent) {
              this.logger.debug('sending error');
              res.status(HttpStatus.NOT_FOUND).json(<AllExceptionBody>{
                message: exception.message,
                statusCode: exception.getStatus(),
              });
            }
          }
        },
      );
    } catch (error) {
      this.logger.debug('Internal');
      this.logger.debug(error);
      throw new InternalServerErrorException('Sorry, something went wrong');
    }
  }
}
