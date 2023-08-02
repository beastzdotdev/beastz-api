import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getByUserId(userId: number) {
    const userIdentity = await this.userIdentityRepository.getByUserId(userId);

    if (!userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_IDENTITY_NOT_FOUND);
    }

    return userIdentity;
  }

  async create(params: CreateUserIdentityParams) {
    return this.userIdentityRepository.create(params);
  }

  async updatePasswordById(id: number, newHashedPassword: string) {
    return this.userIdentityRepository.updatePasswordById(id, newHashedPassword);
  }

  async updateLockedById(id: number, value: boolean) {
    return this.userIdentityRepository.updateLockedById(id, value);
  }

  async updateIsAccVerified(userId: number, isVerified: boolean) {
    return this.userIdentityRepository.updateIsAccVerified(userId, isVerified);
  }
}
