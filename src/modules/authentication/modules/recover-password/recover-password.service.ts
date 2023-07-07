import { Injectable, NotFoundException } from '@nestjs/common';
import { RecoverPasswordRepository } from './recover-password.repository';
import { RecoverPassword } from '@prisma/client';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';

@Injectable()
export class RecoverPasswordService {
  constructor(private readonly recoverPasswordRepository: RecoverPasswordRepository) {}

  async upsert(params: CreateRecoverPasswordParams): Promise<RecoverPassword> {
    return this.recoverPasswordRepository.upsert(params);
  }

  async getByUUID(uuid: string): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.getByUUID(uuid);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async getByUserId(userId: number): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.getByUserId(userId);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams): Promise<RecoverPassword> {
    const recoverPassword = await this.recoverPasswordRepository.updateById(id, params);

    if (!recoverPassword) {
      throw new NotFoundException(ExceptionMessageCode.RECOVER_PASSWORD_REQUEST_NOT_FOUND);
    }

    return recoverPassword;
  }

  async deleteById(uuid: string) {
    return this.recoverPasswordRepository.deleteById(uuid);
  }
}
