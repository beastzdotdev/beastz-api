import { Injectable } from '@nestjs/common';
import { RecoverPasswordAttemptCount } from '@prisma/client';
import { RecoverPasswordAttemptCountRepository } from './recover-password-attempt-count.repository';
import {
  RecoverPasswordAttemptCountCreate,
  RecoverPasswordAttemptCountUpdate,
} from './recover-password-attempt-count.type';
import { PrismaTx } from '@global/prisma';

@Injectable()
export class RecoverPasswordAttemptCountService {
  constructor(private readonly recoverPasswordAttemptCountRepository: RecoverPasswordAttemptCountRepository) {}

  async create(params: RecoverPasswordAttemptCountCreate, tx?: PrismaTx): Promise<RecoverPasswordAttemptCount> {
    return this.recoverPasswordAttemptCountRepository.create(params, tx);
  }

  async getByRecoverPasswordId(
    recoverPasswordId: number,
    flags?: { includeDeleted?: boolean },
    tx?: PrismaTx,
  ): Promise<RecoverPasswordAttemptCount | null> {
    return this.recoverPasswordAttemptCountRepository.getByRecoverPasswordId(recoverPasswordId, flags, tx);
  }

  async updateById(id: number, params: RecoverPasswordAttemptCountUpdate, tx?: PrismaTx) {
    return this.recoverPasswordAttemptCountRepository.updateById(id, params, tx);
  }

  async softDelete(id: number, tx?: PrismaTx) {
    return this.recoverPasswordAttemptCountRepository.softDelete(id, tx);
  }
}
