import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { envVonfig } from 'src/config/config';
import { DatabaseModule } from './@global/database/database.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envVonfig] }),
    DatabaseModule.forRootAsync({
      poolConfig: {
        database: 'cards',
        host: 'localhost',
        user: 'maindoge',
        port: 5432,
        max: 10,
      },
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
