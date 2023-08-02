import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import helmet from 'helmet';

//TODO Implement email service mailgun
//TODO        [ ask toko for downgrading to basic plan, default will force you to pay ]
//TODO        send email for reseting password (message: we have detected credential reuse) - method refreshToken
//TODO        send one time code to user on mail - method recoverPasswordSendVerificationCode
//TODO        send one time code to user on mail - method sendAccountVerificationCode

//TODO return hashed jwt to frontend and make it optional from env add is_jwt_hashed and jwt_hash_secret
//TODO implemetn free logger monitoring service and use winston maybe ??

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors();
  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
});

// so in frontend when for example a,b,c requests are all sent and lets say b was fastest and got refresh
// immediatly when b refreshes a and c must be cancelled, then filled with new accessToken and resent
// which is implemented in this video
// But I think 2 axios instance will be needed one for refresh route and one fore all other
// https://www.youtube.com/watch?v=nI8PYZNFtac
// and this is code example
