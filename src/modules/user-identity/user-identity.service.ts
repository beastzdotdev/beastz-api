import { Injectable } from '@nestjs/common';
import { UserIdentityRepository } from './user-identity.repository';
import { CreateUserIdentityParams } from './user-identity.type';

@Injectable()
export class UserIdentityService {
  constructor(private readonly userIdentityRepository: UserIdentityRepository) {}

  async create(params: CreateUserIdentityParams) {
    return this.userIdentityRepository.create(params);
  }
}
