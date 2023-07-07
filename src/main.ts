import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';

//TODO Copy auth from cards-backend but not use @nestjs/jwt not needed and move refresh token to separate module
//TODO Implement lock in user (add locked in user identity table)
//TODO verify all stuff for jwt https://www.npmjs.com/package/jsonwebtoken

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors();
  app.set('trust proxy', 1);
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }));

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
});
