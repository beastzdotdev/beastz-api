import { Injectable, NotFoundException } from '@nestjs/common';
import { ResetPassword } from '@prisma/client';
import { ResetPasswordRepository } from './reset-password.repository';
import { CreateResetPasswordParams, UpdateResetPasswordParams } from './reset-password.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { PrismaTx } from '@global/prisma';

@Injectable()
export class ResetPasswordService {
  constructor(private readonly resetPasswordRepository: ResetPasswordRepository) {}

  async create(params: CreateResetPasswordParams, tx?: PrismaTx): Promise<ResetPassword> {
    return this.resetPasswordRepository.create(params, tx);
  }

  async getById(id: number, tx?: PrismaTx): Promise<ResetPassword> {
    const resetPassword = await this.resetPasswordRepository.getById(id, tx);

    if (!resetPassword) {
      throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
    }

    return resetPassword;
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<ResetPassword | null> {
    return this.resetPasswordRepository.getByJTI(jti, tx);
  }

  async getByUserId(
    userId: number,
    tx?: PrismaTx,
    flags?: { includeDeleted?: boolean },
  ): Promise<ResetPassword | null> {
    return this.resetPasswordRepository.getByUserId(userId, tx, flags);
  }

  async updateById(id: number, params: UpdateResetPasswordParams, tx?: PrismaTx): Promise<ResetPassword> {
    const resetPassword = await this.resetPasswordRepository.updateById(id, params, tx);

    if (!resetPassword) {
      throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
    }

    return resetPassword;
  }

  async softDelete(id: number, tx?: PrismaTx) {
    return this.resetPasswordRepository.softDelete(id, tx);
  }
}
