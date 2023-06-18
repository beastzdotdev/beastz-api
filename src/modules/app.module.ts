import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { envVonfig } from 'src/config/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, load: [envVonfig] })],
  controllers: [AppController],
})
export class AppModule {}
