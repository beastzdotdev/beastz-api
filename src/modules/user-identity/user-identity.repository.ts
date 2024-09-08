import { Injectable } from '@nestjs/common';
import { PrismaService, PrismaTx } from '@global/prisma';
import { CreateUserIdentityParams } from './user-identity.type';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: number) {
    return this.prismaService.userIdentity.findFirst({
      where: { id },
    });
  }

  async getByUserId(userId: number, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;
    return db.userIdentity.findFirst({ where: { userId } });
  }

  async create(params: CreateUserIdentityParams, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;
    return db.userIdentity.create({ data: params });
  }

  async updatePasswordById(id: number, newHashedPassword: string, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.userIdentity.update({
      where: { id },
      data: { password: newHashedPassword },
    });
  }

  async updateIsLockedById(id: number, value: boolean, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.userIdentity.update({
      where: { id },
      data: { isLocked: value },
    });
  }

  async updateIsAccVerified(userId: number, isAccountVerified: boolean, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.userIdentity.update({
      where: { userId },
      data: { isAccountVerified },
    });
  }
}
