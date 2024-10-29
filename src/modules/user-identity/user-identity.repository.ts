import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService, PrismaTx } from '@global/prisma';
import { Prisma, UserIdentity } from '@prisma/client';
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

  async updateBy(
    condition: { id?: number; userId?: number },
    data: Prisma.UserIdentityUpdateInput,
    tx?: PrismaTx,
  ): Promise<UserIdentity | null> {
    const db = tx ?? this.prismaService;

    if (!Object.values(condition).length) {
      throw new InternalServerErrorException('Condition empty');
    }

    const { id, userId } = condition;

    return db.userIdentity.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }
}
