import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { EnvModule } from './@global/env/env.module';
import { PrismaModule } from './@global/prisma/prisma.module';

@Module({
  imports: [EnvModule.forRoot(), AuthModule, PrismaModule],
  controllers: [AppController],
})
export class AppModule {}
