import { Injectable } from '@nestjs/common';
import { Feedback, Prisma } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FilterFeedbackParams } from './feedback.type';
import { Pagination } from '../../model/types';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: number, body: FeedbackCreateDto, tx: PrismaTx) {
    const db = tx ?? this.prismaService;
    const { review, text, images } = body;
    const imagesFilter = images?.map(el => el.path)?.filter(Boolean);

    return db.feedback.create({
      data: {
        review,
        text,
        userId,
        ...(imagesFilter?.length && { imagesFilter }),
      },
    });
  }

  async getAllByUserIdAndDatesCount(userId: number, startDate: Date, endDate: Date, tx: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.feedback.count({
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
