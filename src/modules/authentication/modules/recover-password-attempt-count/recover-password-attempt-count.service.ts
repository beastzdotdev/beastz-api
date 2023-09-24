import { Injectable } from '@nestjs/common';
import { RecoverPasswordAttemptCountRepository } from './recover-password-attempt-count.repository';
import { RecoverPasswordAttemptCount } from '@prisma/client';
import {
  RecoverPasswordAttemptCountCreate,
  RecoverPasswordAttemptCountUpdate,
} from './recover-password-attempt-count.type';

@Injectable()
export class RecoverPasswordAttemptCountService {
  constructor(private readonly recoverPasswordAttemptCountRepository: RecoverPasswordAttemptCountRepository) {}

  async create(params: RecoverPasswordAttemptCountCreate): Promise<RecoverPasswordAttemptCount> {
    return this.recoverPasswordAttemptCountRepository.create(params);
  }

  async getByRecoverPasswordId(recoverPasswordId: number): Promise<RecoverPasswordAttemptCount | null> {
    return this.recoverPasswordAttemptCountRepository.getByRecoverPasswordId(recoverPasswordId);
  }

  async updateById(id: number, params: RecoverPasswordAttemptCountUpdate) {
    return this.recoverPasswordAttemptCountRepository.updateById(id, params);
  }
}
