import { json, urlencoded } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../src/modules/@global/env/env.dto';
import { EnvironmentType } from '../../src/modules/@global/env/env.interface';
import { AppModule } from '../../src/modules/app.module';
import { AppController } from '../../src/modules/app.controller';

describe('App (e2e)', () => {
  jest.setTimeout(120_000);

  const useLogger = false; // toggle to true if u want to see nestjs logs

  let app: NestExpressApplication;
  let postgreSqlContainer: StartedPostgreSqlContainer;
  let appController: AppController;

  beforeAll(async () => {
    jest.setTimeout(10000); // Set the timeout to 10 seconds

    postgreSqlContainer = await new PostgreSqlContainer().withExposedPorts(5432).start();

    const envValues: Partial<EnvironmentVariables> = {
      DATABASE_URL: postgreSqlContainer.getConnectionUri(),
      DATABASE_LOG_QUERY: true,
      DEBUG: EnvironmentType.DEV,
      PORT: 4000,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({ get: jest.fn(key => envValues[key]) })
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ autoFlushLogs: false, bufferLogs: true });

    if (useLogger) {
      app.useLogger(new Logger('app-e2e-test'));
    }

    app.enableCors();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }));

    appController = app.get(AppController);

    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await postgreSqlContainer?.stop();
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(app).toBeDefined();
    expect(postgreSqlContainer).toBeDefined();
  });

  it('Health check', () => {
    const result = appController.healthCheck();
    expect(result).toBe('ok');
  });
});
