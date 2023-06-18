import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { globalValidationPipeConfig } from './config/global-validation-pipe.config';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';
import { EnvConfig, getEnv } from './config/config';

NestFactory.create<NestExpressApplication>(AppModule).then(async (app: NestExpressApplication) => {
  const configService = app.get(ConfigService<EnvConfig>);
  const logger = new Logger('main.ts');

  app.enableCors();
  app.useGlobalPipes(globalValidationPipeConfig);

  await app.listen(getEnv(configService, 'port'));

  // log misc stuff
  const apiUrl: string = await app.getUrl();
  logger.verbose(`Gorillalock api listening on --- ${apiUrl}`);
});
