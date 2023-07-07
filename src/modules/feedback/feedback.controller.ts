import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiFiles } from 'src/decorator/api-file.decorator';
import { AuthPayload } from 'src/decorator/auth-payload.decorator';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbacksQueryDto } from './dto/filter-feedbacks-query.dto';
import { FeedbackService } from './feedback.service';
import { UserPayload } from '../../model/auth.types';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  async filter(@Query() filterFeedbacksQueryDto: FilterFeedbacksQueryDto) {
    console.log(filterFeedbacksQueryDto);

    return this.feedbackService.filter(filterFeedbacksQueryDto);
  }

  @ApiFiles('images')
  @Post()
  async create(@AuthPayload() authUser: UserPayload, @Body() body: FeedbackCreateDto) {
    await this.feedbackService.create(authUser.userId, body);
  }
}
