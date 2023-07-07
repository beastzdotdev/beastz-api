import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';
import { CreateUserIdentityParams } from './user-identity.type';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateUserIdentityParams) {
    return this.prismaService.userIdentity.create({ data: params });
  }
}
