import { Module } from '@nestjs/common';
import { JwtUtilService } from './jwt-util.service';

@Module({
  providers: [JwtUtilService],
  exports: [JwtUtilService],
})
export class JwtUtilModule {}
