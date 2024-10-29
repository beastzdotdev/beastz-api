import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ResetPasswordAttemptCount } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import { ResetPasswordAttemptCountCreate, ResetPasswordAttemptCountUpdate } from './reset-password-attempt-count.type';

@Injectable()
export class ResetPasswordAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: ResetPasswordAttemptCountCreate, tx?: PrismaTx): Promise<ResetPasswordAttemptCount> {
    const db = tx ?? this.prismaService;
    const { resetPasswordId } = params;

    return db.resetPasswordAttemptCount.create({
      data: {
        resetPasswordId,
      },
    });
  }

  async getByResetPasswordId(
    resetPasswordId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<ResetPasswordAttemptCount | null> {
    const db = tx ?? this.prismaService;
    return db.resetPasswordAttemptCount.findUnique({
      where: {
        resetPasswordId,
        ...(flags && flags.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async updateById(
    id: number,
    params: ResetPasswordAttemptCountUpdate,
    tx?: PrismaTx,
  ): Promise<ResetPasswordAttemptCount | null> {
    const db = tx ?? this.prismaService;
    const { count, countIncreaseLastUpdateDate } = params;

    return db.resetPasswordAttemptCount.update({
      where: {
        id,
      },
      data: {
        count,
        countIncreaseLastUpdateDate,
      },
    });
  }

  async softDelete(id: number, tx?: PrismaTx): Promise<ResetPasswordAttemptCount> {
    const db = tx ?? this.prismaService;
    return db.resetPasswordAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
