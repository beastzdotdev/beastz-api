import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { FeedbackService } from './feedback.service';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService],
})
export class FeedbackModule {}
