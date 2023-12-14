import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { RecoverPasswordAttemptCount } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import {
  RecoverPasswordAttemptCountCreate,
  RecoverPasswordAttemptCountUpdate,
} from './recover-password-attempt-count.type';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class RecoverPasswordAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: RecoverPasswordAttemptCountCreate, tx?: PrismaTx): Promise<RecoverPasswordAttemptCount> {
    const db = tx ?? this.prismaService;
    const { recoverPasswordId } = params;

    return db.recoverPasswordAttemptCount.create({
      data: {
        recoverPasswordId,
      },
    });
  }

  async getByRecoverPasswordId(
    recoverPasswordId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<RecoverPasswordAttemptCount | null> {
    const db = tx ?? this.prismaService;

    return db.recoverPasswordAttemptCount.findUnique({
      where: {
        recoverPasswordId,
        ...(flags && flags.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async updateById(
    id: number,
    params: RecoverPasswordAttemptCountUpdate,
    tx?: PrismaTx,
  ): Promise<RecoverPasswordAttemptCount | null> {
    const db = tx ?? this.prismaService;

    const { count, countIncreaseLastUpdateDate } = params;

    return db.recoverPasswordAttemptCount.update({
      where: {
        id,
      },
      data: {
        count,
        countIncreaseLastUpdateDate,
      },
    });
  }

  async softDelete(id: number, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.recoverPasswordAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
