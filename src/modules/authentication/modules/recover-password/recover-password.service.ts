import { Injectable, NotFoundException } from '@nestjs/common';
import { RecoverPassword } from '@prisma/client';
import { RecoverPasswordRepository } from './recover-password.repository';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';

@Injectable()
export class RecoverPasswordService {
  constructor(private readonly recoverPasswordRepository: RecoverPasswordRepository) {}

  async create(params: CreateRecoverPasswordParams): Promise<RecoverPassword> {
    return this.recoverPasswordRepository.create(params);
  }

  async getById(id: number): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.getById(id);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async getByJTI(jti: string): Promise<RecoverPassword | null> {
    return this.recoverPasswordRepository.getByJTI(jti);
  }

  async getByUserId(userId: number): Promise<RecoverPassword | null> {
    return this.recoverPasswordRepository.getByUserId(userId);
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.updateById(id, params);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async softDelete(id: number) {
    return this.recoverPasswordRepository.softDelete(id);
  }
}
