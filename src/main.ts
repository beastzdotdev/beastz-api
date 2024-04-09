import path from 'path';
import figlet from 'figlet';
import helmet from 'helmet';
import nunjucks from 'nunjucks';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import express from 'express';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import { cyanLog } from './common/helper';
import { setupNunjucksFilters } from './common/nunjucks';
import { absolutePublicPath, absoluteUserUploadPath } from './modules/file-structure/file-structure.helper';

//@ts-expect-error
BigInt.prototype.toJSON = function () {
  return this.toString();
};

NestFactory.create<NestExpressApplication>(AppModule).then(async app => {
  const assetsPath = path.join(__dirname, './assets');
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);

  const nunjuckMainRenderer = nunjucks.configure(assetsPath, {
    express: app,
    autoescape: true,
    watch: true,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
  });

  setupNunjucksFilters(nunjuckMainRenderer);

  app.enableCors({
    credentials: true,
    origin: [envService.get('FRONTEND_URL')],
  });

  app.enableShutdownHooks();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser(envService.get('COOKIE_SECRET')));
  app.use(helmet());
  app.use(compression());
  app.setViewEngine('njk');
  app.setBaseViewsDir(assetsPath);
  app.use('/user-upload', express.static(absoluteUserUploadPath)); // needs security
  app.use('/public', express.static(absolutePublicPath));

  await app.listen(envService.get('PORT'));

  // log misc stuff
  cyanLog(figlet.textSync('Running api : 4000', { font: 'Rectangles', width: 80, whitespaceBreak: true }));
});

// Cool libraries for future
// https://nosir.github.io/cleave.js/
// https://sarcadass.github.io/granim.js/examples.html
