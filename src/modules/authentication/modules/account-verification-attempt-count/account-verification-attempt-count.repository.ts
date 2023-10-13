import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { AccountVerificationAttemptCount } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { AccVerifyAttemptCountCreate, AccVerifyAttemptCountUpdate } from './account-verification-attempt-count.type';

@Injectable()
export class AccountVerificationAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: AccVerifyAttemptCountCreate): Promise<AccountVerificationAttemptCount> {
    const { accountVerificationId } = params;

    return this.prismaService.accountVerificationAttemptCount.create({
      data: {
        accountVerificationId,
      },
    });
  }
  async getByAccVerifyId(
    accountVerificationId: number,
    flags?: { includeDeleted?: boolean },
  ): Promise<AccountVerificationAttemptCount | null> {
    return this.prismaService.accountVerificationAttemptCount.findUnique({
      where: {
        accountVerificationId,
        ...(flags && flags.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  async updateById(id: number, params: AccVerifyAttemptCountUpdate): Promise<AccountVerificationAttemptCount | null> {
    const { count, countIncreaseLastUpdateDate } = params;

    return this.prismaService.accountVerificationAttemptCount.update({
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
    return this.prismaService.accountVerificationAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
