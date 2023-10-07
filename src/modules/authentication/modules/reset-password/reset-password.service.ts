import { Injectable, NotFoundException } from '@nestjs/common';
import { ResetPasswordRepository } from './reset-password.repository';
import { CreateResetPasswordParams, UpdateResetPasswordParams } from './reset-password.type';
import { ResetPassword } from '@prisma/client';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';

@Injectable()
export class ResetPasswordService {
  constructor(private readonly resetPasswordRepository: ResetPasswordRepository) {}

  async create(params: CreateResetPasswordParams): Promise<ResetPassword> {
    return this.resetPasswordRepository.create(params);
  }

  async getById(id: number): Promise<ResetPassword> {
    const resetPassword = await this.resetPasswordRepository.getById(id);

    if (!resetPassword) {
      throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
    }

    return resetPassword;
  }

  async getByJTI(jti: string): Promise<ResetPassword | null> {
    return this.resetPasswordRepository.getByJTI(jti);
  }

  async getByUserId(userId: number): Promise<ResetPassword | null> {
    return this.resetPasswordRepository.getByUserId(userId);
  }

  async updateById(id: number, params: UpdateResetPasswordParams): Promise<ResetPassword> {
    const resetPassword = await this.resetPasswordRepository.updateById(id, params);

    if (!resetPassword) {
      throw new NotFoundException(ExceptionMessageCode.RESET_PASSWORD_REQUEST_NOT_FOUND);
    }

    return resetPassword;
  }

  async softDelete(id: number) {
    return this.resetPasswordRepository.softDelete(id);
  }
}
