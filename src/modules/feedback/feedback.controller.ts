import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { PrismaService, PrismaTx } from '@global/prisma';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbacksQueryDto } from './dto/filter-feedbacks-query.dto';
import { FeedbackService } from './feedback.service';
import { AuthPayloadType } from '../../model/auth.types';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { imageInterceptor } from '../../common/helper';
import { transaction } from '../../common/transaction';

@Controller('feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async filter(@Query() filterFeedbacksQueryDto: FilterFeedbacksQueryDto) {
    return this.feedbackService.filter(filterFeedbacksQueryDto);
  }

  @Post()
  @FileUploadInterceptor(...imageInterceptor(FeedbackCreateDto))
  async create(@AuthPayload() authPayload: AuthPayloadType, @Body() body: FeedbackCreateDto) {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.feedbackService.create(authPayload.user.id, body, tx);
    });
  }
}
