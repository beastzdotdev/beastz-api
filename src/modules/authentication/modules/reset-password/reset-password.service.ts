import { Injectable } from '@nestjs/common';
import { ResetPasswordRepository } from './reset-password.repository';
import { CreateResetPasswordParams } from './reset-password.type';
import { ResetPassword } from '@prisma/client';

@Injectable()
export class ResetPasswordService {
  constructor(private readonly resetPasswordHistoryRepository: ResetPasswordRepository) {}

  async create(params: CreateResetPasswordParams): Promise<ResetPassword> {
    return this.resetPasswordHistoryRepository.create(params);
  }
}
