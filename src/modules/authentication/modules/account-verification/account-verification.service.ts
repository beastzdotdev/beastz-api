import { Injectable } from '@nestjs/common';
import { AccountVerificationRepository } from './account-verification.repository';
import { AccountVerificationParams } from './account-verification.type';

@Injectable()
export class AccountVerificationService {
  constructor(private readonly accountVerificationRepository: AccountVerificationRepository) {}

  async upsert(params: AccountVerificationParams) {
    return this.accountVerificationRepository.upsert(params);
  }

  async getByUserId(userId: number) {
    return this.accountVerificationRepository.getByUserId(userId);
  }
}
