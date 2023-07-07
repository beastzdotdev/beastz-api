import { Module } from '@nestjs/common';
import { RandomService } from './random.service';

@Module({
  imports: [RandomService],
  exports: [RandomService],
})
export class RandomModule {}
