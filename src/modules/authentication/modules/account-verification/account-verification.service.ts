import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountVerification } from '@prisma/client';
import { AccountVerificationRepository } from './account-verification.repository';
import { CreateAccountVerificationParams, UpdateAccountVerificationParams } from './account-verification.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class AccountVerificationService {
  constructor(private readonly accountVerificationRepository: AccountVerificationRepository) {}

  async getByUserId(userId: number, tx?: PrismaTx, flags?: { includeDeleted?: boolean }) {
    return this.accountVerificationRepository.getByUserId(userId, tx, flags);
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<AccountVerification | null> {
    return this.accountVerificationRepository.getByJTI(jti, tx);
  }

  async create(params: CreateAccountVerificationParams, tx?: PrismaTx) {
    const accountVerification = await this.accountVerificationRepository.create(params, tx);

    if (!accountVerification) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    return accountVerification;
  }

  async updateById(id: number, params: UpdateAccountVerificationParams, tx?: PrismaTx) {
    const accountVerification = await this.accountVerificationRepository.updateById(id, params, tx);

    if (!accountVerification) {
      throw new NotFoundException(ExceptionMessageCode.ACCOUNT_VERIFICATION_REQUEST_NOT_FOUND);
    }

    return accountVerification;
  }

  async softDelete(id: number, tx?: PrismaTx) {
    return this.accountVerificationRepository.softDelete(id, tx);
  }
}
