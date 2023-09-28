import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountVerificationRepository } from './account-verification.repository';
import { CreateAccountVerificationParams, UpdateAccountVerificationParams } from './account-verification.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { AccountVerification } from '@prisma/client';

@Injectable()
export class AccountVerificationService {
  constructor(private readonly accountVerificationRepository: AccountVerificationRepository) {}

  async getByUserId(userId: number) {
    return this.accountVerificationRepository.getByUserId(userId);
  }

  async getByJTI(jti: string): Promise<AccountVerification | null> {
    return this.accountVerificationRepository.getByJTI(jti);
  }

  async create(params: CreateAccountVerificationParams) {
    const accountVerification = await this.accountVerificationRepository.create(params);

    if (!accountVerification) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    return accountVerification;
  }

  async updateById(id: number, params: UpdateAccountVerificationParams) {
    const accountVerification = await this.accountVerificationRepository.updateById(id, params);

    if (!accountVerification) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    return accountVerification;
  }

  async softDelete(id: number) {
    return this.accountVerificationRepository.softDelete(id);
  }
}
