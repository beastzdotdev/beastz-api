import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './@global/database/database.module';
import { AuthModule } from './auth/auth.module';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { EnvModule } from './@global/env/env.module';
import { EnvService } from './@global/env/env.service';
import { ENV_SERVICE_TOKEN } from './@global/env/env.constants';

@Module({
  imports: [
    EnvModule.forRoot(),
    DatabaseModule.forRootAsync({
      inject: [ENV_SERVICE_TOKEN],
      useFactory: async (envService: EnvService) => ({
        dialect: new PostgresDialect({
          pool: new Pool({
            database: envService.get('DATABASE_NAME'),
            host: envService.get('DATABASE_HOST'),
            user: envService.get('DATABASE_USER'),
            password: envService.get('DATABASE_PASS'),
            port: envService.get('DATABASE_PORT'),
            max: envService.get('DATABASE_MAX_POOL'),
          }),
        }),
      }),
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
