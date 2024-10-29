import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaTx } from '@global/prisma';
import { Prisma, UserIdentity } from '@prisma/client';
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

  async updateBy(
    condition: { id?: number; userId?: number },
    data: Prisma.UserIdentityUpdateInput,
    tx?: PrismaTx,
  ): Promise<UserIdentity | null> {
    return this.userIdentityRepository.updateBy(condition, data, tx);
  }
}
