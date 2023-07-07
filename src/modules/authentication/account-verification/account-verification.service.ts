import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountVerificationRepository } from './account-verification.repository';
import { AccountVerificationParams } from './account-verification.type';
import { ExceptionMessageCode } from '../../../exceptions/exception-message-code.enum';

@Injectable()
export class AccountVerificationService {
  constructor(private readonly accountVerificationRepository: AccountVerificationRepository) {}

  async upsert(params: AccountVerificationParams) {
    return this.accountVerificationRepository.upsert(params);
  }

  async getByUserId(userId: number) {
    return this.accountVerificationRepository.getByUserId(userId);
  }

  async getIsVerifiedByUserId(userId: number): Promise<boolean> {
    const isVerified = await this.accountVerificationRepository.getIsVerifiedByUserId(userId);

    if (isVerified === undefined || isVerified === null) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFFICATION_REQUEST_NOT_FOUND);
    }

    return isVerified;
  }

  async updateIsVerified(userId: number, isVerified: boolean) {
    return this.accountVerificationRepository.updateIsVerified(userId, isVerified);
  }
}
