import * as bodyParser from 'body-parser';
import * as request from 'supertest';

import { PoolConfig } from 'pg';
import { Kysely } from 'kysely';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from 'testcontainers';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';

import { EnvironmentVariables } from '../src/modules/@global/env/env.dto';
import { EnvironmentType } from '../src/modules/@global/env/env.interface';
import { AppModule } from '../src/modules/app.module';
import { ConfigService } from '@nestjs/config';
import { migrateCommand, getMigrations } from '../src/common/migrate';
import { ENV_SERVICE_TOKEN } from '../src/modules/@global/env/env.constants';
import { EnvService } from '../src/modules/@global/env/env.service';
import { KYSELY_MODULE_CONNECTION_TOKEN } from '../src/modules/@global/database/database.constants';

describe('App (e2e)', () => {
  jest.setTimeout(120_000);

  const useLogger = true; // toggle to true if u want to see nestjs logs

  //TODO add database interface
  let app: NestExpressApplication;
  let db: Kysely<unknown>;
  let envService: EnvService;
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let http: request.SuperTest<request.Test>;

  beforeAll(async () => {
    jest.setTimeout(10000); // Set the timeout to 10 seconds

    postgreSqlContainer = await new PostgreSqlContainer().withExposedPorts(5432).start();

    const envValues: EnvironmentVariables = {
      DATABASE_NAME: postgreSqlContainer.getDatabase(),
      DATABASE_PASS: postgreSqlContainer.getPassword(),
      DATABASE_HOST: postgreSqlContainer.getHost(),
      DATABASE_USER: postgreSqlContainer.getUsername(),
      DATABASE_PORT: postgreSqlContainer.getFirstMappedPort(),
      DATABASE_MAX_POOL: 10,
      DEBUG: EnvironmentType.Dev,
      PORT: 4000,
      RUN_AUTO_MIGRATE: true,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({ get: jest.fn(key => envValues[key]) })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ autoFlushLogs: false, bufferLogs: true });

    envService = app.get<string, EnvService>(ENV_SERVICE_TOKEN);
    db = app.get<string, Kysely<unknown>>(KYSELY_MODULE_CONNECTION_TOKEN);

    if (useLogger) {
      app.useLogger(new Logger('app-e2e-test'));
    }

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

    await app.init();

    // initialize http first
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await db.destroy();
    await app?.close();
    await postgreSqlContainer?.stop();
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
    expect(postgreSqlContainer).toBeDefined();
    expect(http).toBeDefined();
  });

  it('Health check', () => {
    return http.get('/health').expect(200);
  });
});
