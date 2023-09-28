import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { RecoverPasswordAttemptCount } from '@prisma/client';
import {
  RecoverPasswordAttemptCountCreate,
  RecoverPasswordAttemptCountUpdate,
} from './recover-password-attempt-count.type';

@Injectable()
export class RecoverPasswordAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: RecoverPasswordAttemptCountCreate): Promise<RecoverPasswordAttemptCount> {
    const { recoverPasswordId } = params;

    return this.prismaService.recoverPasswordAttemptCount.create({
      data: {
        recoverPasswordId,
      },
    });
  }

  async getByRecoverPasswordId(recoverPasswordId: number): Promise<RecoverPasswordAttemptCount | null> {
    return this.prismaService.recoverPasswordAttemptCount.findUnique({
      where: {
        recoverPasswordId,
        deletedAt: null,
      },
    });
  }

  async updateById(id: number, params: RecoverPasswordAttemptCountUpdate): Promise<RecoverPasswordAttemptCount | null> {
    const { count, countIncreaseLastUpdateDate } = params;

    return this.prismaService.recoverPasswordAttemptCount.update({
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
    return this.prismaService.recoverPasswordAttemptCount.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
