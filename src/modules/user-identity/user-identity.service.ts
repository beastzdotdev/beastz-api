import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaTx } from '@global/prisma';
import { UserIdentityRepository } from './user-identity.repository';
import { CreateUserIdentityParams } from './user-identity.type';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';

@Injectable()
export class UserIdentityService {
  constructor(private readonly userIdentityRepository: UserIdentityRepository) {}

  async getById(id: number) {
    const userIdentity = await this.userIdentityRepository.getById(id);

    if (!userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    return userIdentity;
  }

  async getByUserId(userId: number, tx?: PrismaTx) {
    const userIdentity = await this.userIdentityRepository.getByUserId(userId, tx);

    if (!userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    return userIdentity;
  }

  async create(params: CreateUserIdentityParams, tx?: PrismaTx) {
    return this.userIdentityRepository.create(params, tx);
  }

  async updatePasswordById(id: number, newHashedPassword: string, tx?: PrismaTx) {
    return this.userIdentityRepository.updatePasswordById(id, newHashedPassword, tx);
  }

  async updateIsLockedById(id: number, value: boolean, tx?: PrismaTx) {
    return this.userIdentityRepository.updateIsLockedById(id, value, tx);
  }

  async updateIsAccVerified(userId: number, isVerified: boolean, tx?: PrismaTx) {
    return this.userIdentityRepository.updateIsAccVerified(userId, isVerified, tx);
  }
}
