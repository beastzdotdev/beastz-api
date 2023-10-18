import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';
import { CreateUserIdentityParams } from './user-identity.type';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number) {
    return this.prismaService.userIdentity.findFirst({
      where: { id },
    });
  }

  async getByUserId(userId: number, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;
    return db.userIdentity.findFirst({ where: { userId } });
  }

  async create(params: CreateUserIdentityParams, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;
    return db.userIdentity.create({ data: params });
  }

  async updatePasswordById(id: number, newHashedPassword: string) {
    return this.prismaService.userIdentity.update({
      where: { id },
      data: { password: newHashedPassword },
    });
  }

  async updateIsLockedById(id: number, value: boolean, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;

    return db.userIdentity.update({
      where: { id },
      data: { isLocked: value },
    });
  }

  async updateIsAccVerified(userId: number, isAccountVerified: boolean) {
    return this.prismaService.userIdentity.update({
      where: { userId },
      data: { isAccountVerified },
    });
  }
}
