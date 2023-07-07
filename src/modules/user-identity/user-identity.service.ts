import { Injectable, NotFoundException } from '@nestjs/common';
import { UserIdentityRepository } from './user-identity.repository';
import { CreateUserIdentityParams } from './user-identity.type';
import { ExceptionMessageCode } from '../../exceptions/exception-message-code.enum';

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

  async create(params: CreateUserIdentityParams) {
    return this.userIdentityRepository.create(params);
  }

  async updatePasswordById(id: number, newHashedPassword: string) {
    return this.userIdentityRepository.updatePasswordById(id, newHashedPassword);
  }
}
