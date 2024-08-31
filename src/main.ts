import figlet from 'figlet';
import helmet from 'helmet';
import Redis from 'ioredis';
import path from 'node:path';
import express from 'express';
import nunjucks from 'nunjucks';
import process from 'node:process';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { Logger } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { NestApplication, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

import { AppModule } from './modules/app.module';
import { appLogger, signals } from './common/helper';
import { setupNunjucksFilters } from './common/nunjucks';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import { absPublicPath } from './modules/file-structure/file-structure.helper';
import { RedisIoAdapter } from './modules/@global/socket/document/document-socket.adapter';

NestFactory.create<NestExpressApplication>(AppModule).then(async app => {
  const startingTime = performance.now();
  const logger = new Logger(NestApplication.name);
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);

  const assetsPath = path.join(__dirname, './assets');
  const hostname = envService.isDev() ? '0.0.0.0' : 'localhost';

  const nunjuckMainRenderer = nunjucks.configure(assetsPath, {
    express: app,
    autoescape: true,
    watch: true,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
  });

  setupNunjucksFilters(nunjuckMainRenderer);

  app.enableShutdownHooks();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser(envService.get('COOKIE_SECRET')));
  app.enableCors({
    credentials: true,
    exposedHeaders: ['Content-Title'],
    origin: [envService.get('FRONTEND_URL'), envService.get('FRONTEND_DOCUMENT_URL')],
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    }),
  );
  app.use(compression());
  app.setViewEngine('njk');
  app.setBaseViewsDir(assetsPath);
  app.use('/public', express.static(absPublicPath()));

  // Wrap socket
  const redis = app.get<Redis>(getRedisConnectionToken());
  const redisIoAdapter = new RedisIoAdapter(app, redis, envService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(envService.get('PORT'), hostname);

  // Measure startup time
  const totalTimeInMs = (performance.now() - startingTime).toFixed(3) + ' ms';
  logger.verbose(`Nest application initialized (Node: ${process.versions.node}) (${totalTimeInMs})`);

  // Log misc stuff
  appLogger.cyanLog(
    figlet.textSync(`Running api : ${envService.get('PORT')}`, {
      font: 'Rectangles',
      width: 80,
      whitespaceBreak: true,
    }),
  );

  // Gracefull Shutdown
  const shutdown = async (signal: string, code: number): Promise<void> => {
    console.log('\n');
    logger.verbose('shutdown!');

    await app.close();
    logger.verbose(`server stopped by ${signal} with code ${code}`);

    process.exit(code);
  };

  process.on(signals.SIGINT, shutdown);
  process.on(signals.SIGTERM, shutdown);
  process.on(signals.SIGQUIT, shutdown);
  process.on(signals.SIGQUIT, shutdown);
  process.on(signals.SIGTSTP, shutdown);
  process.on(signals.SIGABRT, shutdown);
  process.on('uncaughtException', shutdown);
  process.on('unhandledRejection', shutdown);
});
