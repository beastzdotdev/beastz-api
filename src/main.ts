import figlet from 'figlet';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { AppModule } from './modules/app.module';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import { cyanLog } from './common/helper';

NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true }).then(async app => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors({
    credentials: true,
    origin: [envService.get('FRONTEND_URL')],
    // origin: [envService.get('FRONTEND_URL'), 'http://localhost:5173', 'http://127.0.0.1', 'http://localhost'],
  });

  app.enableShutdownHooks();
  app.set('trust proxy', true);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser(envService.get('COOKIE_SECRET')));
  app.use(helmet());

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
  cyanLog(figlet.textSync('Running api : 4000', { font: 'Rectangles', width: 80, whitespaceBreak: true }));
});

// Cool libraries for future
// https://nosir.github.io/cleave.js/
// https://sarcadass.github.io/granim.js/examples.html
