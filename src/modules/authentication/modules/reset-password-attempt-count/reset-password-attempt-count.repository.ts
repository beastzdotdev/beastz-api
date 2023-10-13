import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ResetPasswordAttemptCount } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { ResetPasswordAttemptCountCreate, ResetPasswordAttemptCountUpdate } from './reset-password-attempt-count.type';

@Injectable()
export class ResetPasswordAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: ResetPasswordAttemptCountCreate): Promise<ResetPasswordAttemptCount> {
    const { resetPasswordId } = params;

    return this.prismaService.resetPasswordAttemptCount.create({
      data: {
        resetPasswordId,
      },
    });
  }

  async getByResetPasswordId(
    resetPasswordId: number,
    flags?: { includeDeleted?: boolean },
  ): Promise<ResetPasswordAttemptCount | null> {
    return this.prismaService.resetPasswordAttemptCount.findUnique({
      where: {
        resetPasswordId,
        ...(flags && flags.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async updateById(id: number, params: ResetPasswordAttemptCountUpdate): Promise<ResetPasswordAttemptCount | null> {
    const { count, countIncreaseLastUpdateDate } = params;

    return this.prismaService.resetPasswordAttemptCount.update({
      where: {
        id,
      },
      data: {
        count,
        countIncreaseLastUpdateDate,
      },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.resetPasswordAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
