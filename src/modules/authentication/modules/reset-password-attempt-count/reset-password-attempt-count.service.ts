import { Injectable } from '@nestjs/common';
import { ResetPasswordAttemptCount } from '@prisma/client';
import { ResetPasswordAttemptCountRepository } from './reset-password-attempt-count.repository';
import { ResetPasswordAttemptCountCreate, ResetPasswordAttemptCountUpdate } from './reset-password-attempt-count.type';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class ResetPasswordAttemptCountService {
  constructor(private readonly resetPasswordAttemptCountRepository: ResetPasswordAttemptCountRepository) {}

  async create(params: ResetPasswordAttemptCountCreate, tx?: PrismaTx): Promise<ResetPasswordAttemptCount> {
    return this.resetPasswordAttemptCountRepository.create(params, tx);
  }

  async getByResetPasswordId(
    ResetPasswordId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<ResetPasswordAttemptCount | null> {
    return this.resetPasswordAttemptCountRepository.getByResetPasswordId(ResetPasswordId, flags, tx);
  }

  async updateById(id: number, params: ResetPasswordAttemptCountUpdate, tx?: PrismaTx) {
    return this.resetPasswordAttemptCountRepository.updateById(id, params, tx);
  }

  async softDelete(id: number, tx?: PrismaTx) {
    return this.resetPasswordAttemptCountRepository.softDelete(id, tx);
  }
}
