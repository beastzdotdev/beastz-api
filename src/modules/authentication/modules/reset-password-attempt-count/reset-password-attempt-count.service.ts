import { Injectable } from '@nestjs/common';
import { ResetPasswordAttemptCount } from '@prisma/client';
import { ResetPasswordAttemptCountRepository } from './reset-password-attempt-count.repository';
import { ResetPasswordAttemptCountCreate, ResetPasswordAttemptCountUpdate } from './reset-password-attempt-count.type';

@Injectable()
export class ResetPasswordAttemptCountService {
  constructor(private readonly resetPasswordAttemptCountRepository: ResetPasswordAttemptCountRepository) {}

  async create(params: ResetPasswordAttemptCountCreate): Promise<ResetPasswordAttemptCount> {
    return this.resetPasswordAttemptCountRepository.create(params);
  }

  async getByResetPasswordId(
    ResetPasswordId: number,
    flags?: { includeDeleted?: boolean },
  ): Promise<ResetPasswordAttemptCount | null> {
    return this.resetPasswordAttemptCountRepository.getByResetPasswordId(ResetPasswordId, flags);
  }

  async updateById(id: number, params: ResetPasswordAttemptCountUpdate) {
    return this.resetPasswordAttemptCountRepository.updateById(id, params);
  }

  async softDelete(id: number) {
    return this.resetPasswordAttemptCountRepository.softDelete(id);
  }
}
