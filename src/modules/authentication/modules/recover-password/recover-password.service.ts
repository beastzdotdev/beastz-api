import { Injectable, NotFoundException } from '@nestjs/common';
import { RecoverPassword } from '@prisma/client';
import { RecoverPasswordRepository } from './recover-password.repository';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { PrismaTx } from '@global/prisma';

@Injectable()
export class RecoverPasswordService {
  constructor(private readonly recoverPasswordRepository: RecoverPasswordRepository) {}

  async create(params: CreateRecoverPasswordParams, tx?: PrismaTx): Promise<RecoverPassword> {
    return this.recoverPasswordRepository.create(params, tx);
  }

  async getById(id: number, tx?: PrismaTx): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.getById(id, tx);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<RecoverPassword | null> {
    return this.recoverPasswordRepository.getByJTI(jti, tx);
  }

  async getByUserId(
    userId: number,
    tx?: PrismaTx,
    flags?: { includeDeleted?: boolean },
  ): Promise<RecoverPassword | null> {
    return this.recoverPasswordRepository.getByUserId(userId, tx, flags);
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams, tx?: PrismaTx): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.updateById(id, params, tx);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async softDelete(id: number, tx?: PrismaTx): Promise<RecoverPassword> {
    return this.recoverPasswordRepository.softDelete(id, tx);
  }
}
