import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { envVonfig } from 'src/config/config';
import { DatabaseModule } from './@global/database/database.module';
import { AuthModule } from './auth/auth.module';
import { PostgresDialect } from 'kysely';
import { Pool } from 'pg';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envVonfig] }),
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        dialect: new PostgresDialect({
          pool: new Pool({
            //TODO make this type safe (first remove todo from config.ts file then deal with this)
            database: configService.get('DATABASE_NAME'),
            host: configService.get('DATABASE_HOST'),
            user: configService.get('DATABASE_USER'),
            password: configService.get('DATABASE_PASS'),
            port: configService.get('DATABASE_PORT'),
            max: configService.get('DATABASE_MAX_POOL'),
          }),
        }),
      }),
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

// poolConfig: {

// },
