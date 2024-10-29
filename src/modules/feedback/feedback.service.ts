import moment from 'moment';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Feedback } from '@prisma/client';
import { EnvService, InjectEnv } from '@global/env';
import { PrismaTx } from '@global/prisma';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FeedbackRepository } from './feedback.repository';
import { FilterFeedbackParams } from './feedback.type';
import { Pagination } from '../../model/types';
import { TooManyRequestException } from '../../exceptions/too-many-request.exception';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectEnv()
    private readonly env: EnvService,

    private readonly feedbackRepository: FeedbackRepository,
  ) {}

  async filter(params: FilterFeedbackParams): Promise<Pagination<Feedback>> {
    return this.feedbackRepository.filter(params);
  }

  async create(userId: number, body: FeedbackCreateDto, tx: PrismaTx) {
    // check if user has requested more than {some number in env} times for feedback
    const startDate = moment().startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    const feedbacksCount = await this.feedbackRepository.getAllByUserIdAndDatesCount(userId, startDate, endDate, tx);

    if (feedbacksCount >= this.env.get('MAX_FEEDBACK_PER_DAY_COUNT')) {
      throw new TooManyRequestException();
    }

    throw new InternalServerErrorException('Method not implemented yet');

    return this.feedbackRepository.create(userId, body, tx);
  }
}
