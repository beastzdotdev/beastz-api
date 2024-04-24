import { Injectable } from '@nestjs/common';
import { Feedback, Prisma } from '@prisma/client';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbackParams } from './feedback.type';
import { PrismaService } from '../@global/prisma/prisma.service';
import { Pagination } from '../../model/types';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, body: FeedbackCreateDto) {
    return this.prismaService.feedback.create({
      data: {
        ...body,
        userId,
        images: body.images?.map(el => el.path),
      },
    });
  }

  async getAllByUserIdAndDatesCount(userId: number, startDate: Date, endDate: Date) {
    return this.prismaService.feedback.count({
      where: {
        userId,
        createdAt: {
          gte: startDate.toISOString(),
          lte: endDate.toISOString(),
        },
      },
    });
  }

  async filter(params: FilterFeedbackParams): Promise<Pagination<Feedback>> {
    const { page, pageSize, userId } = params;

    const where: Prisma.FeedbackWhereInput = {
      ...(userId && { userId }),
    };

    const [data, total] = await Promise.all([
      this.prismaService.feedback.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prismaService.feedback.count({
        where,
      }),
    ]);

    return { total, data };
  }
}
