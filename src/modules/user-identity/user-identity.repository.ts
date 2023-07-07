import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';
import { CreateUserIdentityParams } from './user-identity.type';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number) {
    return this.prismaService.userIdentity.findFirst({
      where: { id },
    });
  }

  async create(params: CreateUserIdentityParams) {
    return this.prismaService.userIdentity.create({ data: params });
  }

  async updatePasswordById(id: number, newHashedPassword: string) {
    return this.prismaService.userIdentity.update({
      where: { id },
      data: { password: newHashedPassword },
    });
  }
}
