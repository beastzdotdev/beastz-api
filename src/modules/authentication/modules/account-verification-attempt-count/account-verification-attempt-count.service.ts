import { Injectable } from '@nestjs/common';
import { AccountVerificationAttemptCountRepository } from './account-verification-attempt-count.repository';
import { AccountVerificationAttemptCount } from '@prisma/client';
import { AccVerifyAttemptCountCreate, AccVerifyAttemptCountUpdate } from './account-verification-attempt-count.type';

@Injectable()
export class AccountVerificationAttemptCountService {
  constructor(private readonly accountVerificationAttemptCountRepository: AccountVerificationAttemptCountRepository) {}

  async create(params: AccVerifyAttemptCountCreate): Promise<AccountVerificationAttemptCount> {
    return this.accountVerificationAttemptCountRepository.create(params);
  }

  async getByAccountVerificationId(accVerifyId: number): Promise<AccountVerificationAttemptCount | null> {
    return this.accountVerificationAttemptCountRepository.getByAccountVerificationId(accVerifyId);
  }

  async updateById(id: number, params: AccVerifyAttemptCountUpdate): Promise<AccountVerificationAttemptCount | null> {
    return this.accountVerificationAttemptCountRepository.updateById(id, params);
  }

  async softDelete(id: number) {
    return this.accountVerificationAttemptCountRepository.softDelete(id);
  }
}
