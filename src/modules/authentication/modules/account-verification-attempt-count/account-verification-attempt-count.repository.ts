import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { AccountVerificationAttemptCount } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { AccVerifyAttemptCountCreate, AccVerifyAttemptCountUpdate } from './account-verification-attempt-count.type';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class AccountVerificationAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: AccVerifyAttemptCountCreate, tx?: PrismaTx): Promise<AccountVerificationAttemptCount> {
    const db = tx ? tx : this.prismaService;
    const { accountVerificationId } = params;

    return db.accountVerificationAttemptCount.create({
      data: {
        accountVerificationId,
      },
    });
  }
  async getByAccVerifyId(
    accountVerificationId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<AccountVerificationAttemptCount | null> {
    const db = tx ? tx : this.prismaService;

    return db.accountVerificationAttemptCount.findUnique({
      where: {
        accountVerificationId,
        ...(flags && flags.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async updateById(
    id: number,
    params: AccVerifyAttemptCountUpdate,
    tx?: PrismaTx,
  ): Promise<AccountVerificationAttemptCount | null> {
    const db = tx ? tx : this.prismaService;
    const { count, countIncreaseLastUpdateDate } = params;

    return db.accountVerificationAttemptCount.update({
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
    const db = tx ? tx : this.prismaService;

    return db.accountVerificationAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
