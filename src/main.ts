import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './modules/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { EnvService } from './modules/@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './modules/@global/env/env.constants';
import { getMigrations, migrateCommand } from './common/migrate';
import { PoolConfig } from 'pg';

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
  const logger = new Logger('Main logger');

  app.enableCors();
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }));

  const config: PoolConfig = {
    database: envService.get('DATABASE_NAME'),
    host: envService.get('DATABASE_HOST'),
    user: envService.get('DATABASE_USER'),
    password: envService.get('DATABASE_PASS'),
    port: envService.get('DATABASE_PORT'),
    max: envService.get('DATABASE_MAX_POOL'),
  };

  if (envService.get('RUN_AUTO_MIGRATE')) {
    // run auto migrate
    await migrateCommand(config, 'latest', {
      dontExit: true,
    });
  } else {
    await getMigrations(config);
  }

  await app.listen(envService.get('PORT'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`GorillaVault api listening on --- ${apiUrl}`);
});
