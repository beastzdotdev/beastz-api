import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiFiles } from 'src/decorator/api-file.decorator';
import { AuthPayload } from 'src/decorator/auth-payload.decorator';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbacksQueryDto } from './dto/filter-feedbacks-query.dto';
import { FeedbackService } from './feedback.service';
import { AuthPayloadType } from '../../model/auth.types';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async filter(@Query() filterFeedbacksQueryDto: FilterFeedbacksQueryDto) {
    return this.feedbackService.filter(filterFeedbacksQueryDto);
  }

  @ApiFiles('images')
  @Post()
  async create(@AuthPayload() authPayload: AuthPayloadType, @Body() body: FeedbackCreateDto) {
    await this.feedbackService.create(authPayload.user.id, body);
  }
}
