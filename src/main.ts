import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';

//TODO MAIN
// recover_password/account_verification attempt count validation must be implemented
// recover password need some adjustments

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors();
  app.enableShutdownHooks();
  app.set('trust proxy', true);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  app.use(helmet());

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
});
