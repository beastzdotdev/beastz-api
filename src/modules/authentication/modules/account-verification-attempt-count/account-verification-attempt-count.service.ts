import { Injectable } from '@nestjs/common';
import { AccountVerificationAttemptCount } from '@prisma/client';
import { AccountVerificationAttemptCountRepository } from './account-verification-attempt-count.repository';
import { AccVerifyAttemptCountCreate, AccVerifyAttemptCountUpdate } from './account-verification-attempt-count.type';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class AccountVerificationAttemptCountService {
  constructor(private readonly accountVerificationAttemptCountRepository: AccountVerificationAttemptCountRepository) {}

  async create(params: AccVerifyAttemptCountCreate, tx?: PrismaTx): Promise<AccountVerificationAttemptCount> {
    return this.accountVerificationAttemptCountRepository.create(params, tx);
  }

  async getByAccVerifyId(
    accVerifyId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<AccountVerificationAttemptCount | null> {
    return this.accountVerificationAttemptCountRepository.getByAccVerifyId(accVerifyId, flags, tx);
  }

  async updateById(
    id: number,
    params: AccVerifyAttemptCountUpdate,
    tx?: PrismaTx,
  ): Promise<AccountVerificationAttemptCount | null> {
    return this.accountVerificationAttemptCountRepository.updateById(id, params, tx);
  }

  async softDelete(id: number, tx?: PrismaTx) {
    return this.accountVerificationAttemptCountRepository.softDelete(id, tx);
  }
}
