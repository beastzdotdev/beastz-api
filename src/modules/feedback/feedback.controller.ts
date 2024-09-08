import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbacksQueryDto } from './dto/filter-feedbacks-query.dto';
import { FeedbackService } from './feedback.service';
import { AuthPayloadType } from '../../model/auth.types';
import { AuthPayload } from '../../decorator/auth-payload.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async filter(@Query() filterFeedbacksQueryDto: FilterFeedbacksQueryDto) {
    return this.feedbackService.filter(filterFeedbacksQueryDto);
  }

  //TODO check this, add each to IsMulterFile
  // @ApiFiles('images')
  @Post()
  async create(@AuthPayload() authPayload: AuthPayloadType, @Body() body: FeedbackCreateDto) {
    await this.feedbackService.create(authPayload.user.id, body);
  }
}
