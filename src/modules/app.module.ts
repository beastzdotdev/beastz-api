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
      useFactory: async (envService: EnvService) => {
        // console.log('='.repeat(20));
        // console.log('pool');
        // console.log({
        //   database: envService.get('DATABASE_NAME'),
        //   host: envService.get('DATABASE_HOST'),
        //   user: envService.get('DATABASE_USER'),
        //   password: envService.get('DATABASE_PASS'),
        //   port: envService.get('DATABASE_PORT'),
        //   max: envService.get('DATABASE_MAX_POOL'),
        // });

        const pool = new Pool({
          database: envService.get('DATABASE_NAME'),
          host: envService.get('DATABASE_HOST'),
          user: envService.get('DATABASE_USER'),
          password: envService.get('DATABASE_PASS'),
          port: envService.get('DATABASE_PORT'),
          max: envService.get('DATABASE_MAX_POOL'),

          allowExitOnIdle: false,
          keepAlive: true,
          idle_in_transaction_session_timeout: 300000,
          statement_timeout: 300000,
          idleTimeoutMillis: 300000,
          query_timeout: 300000,
          connectionTimeoutMillis: 300000,
          log(...messages) {
            console.log(messages);
          },
        });

        pool.on('error', err => {
          console.log(err);
        });

        return {
          log: ['query', 'error'],
          dialect: new PostgresDialect({
            pool,
          }),
        };
      },
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
