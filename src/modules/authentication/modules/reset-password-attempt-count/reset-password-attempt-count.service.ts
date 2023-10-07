import { Injectable } from '@nestjs/common';
import { ResetPasswordAttemptCountRepository } from './reset-password-attempt-count.repository';
import { ResetPasswordAttemptCount } from '@prisma/client';
import { ResetPasswordAttemptCountCreate, ResetPasswordAttemptCountUpdate } from './reset-password-attempt-count.type';

@Injectable()
export class ResetPasswordAttemptCountService {
  constructor(private readonly ResetPasswordAttemptCountRepository: ResetPasswordAttemptCountRepository) {}

  async create(params: ResetPasswordAttemptCountCreate): Promise<ResetPasswordAttemptCount> {
    return this.ResetPasswordAttemptCountRepository.create(params);
  }

  async getByResetPasswordId(
    ResetPasswordId: number,
    flags?: { includeDeleted?: boolean },
  ): Promise<ResetPasswordAttemptCount | null> {
    return this.ResetPasswordAttemptCountRepository.getByResetPasswordId(ResetPasswordId, flags);
  }

  async updateById(id: number, params: ResetPasswordAttemptCountUpdate) {
    return this.ResetPasswordAttemptCountRepository.updateById(id, params);
  }

  async softDelete(id: number) {
    return this.ResetPasswordAttemptCountRepository.softDelete(id);
  }
}
