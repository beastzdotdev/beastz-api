import { Injectable } from '@nestjs/common';
import { Prisma, UserSupportMessage } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { CreateUserSupportMessageParams, UpdateUserSupportMessageParams } from './user-support-message.type';
import { Pagination } from '../../model/types';
import { UserSupportMessageQueryAllDto } from './dto/user-support-message-get-all-query.dto';

@Injectable()
export class UserSupportMessageRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async existsById(id: number, userId: number, tx?: PrismaTx): Promise<boolean> {
    const db = tx ?? this.prismaService;

    const count = await db.userSupportMessage.count({
      where: {
        id,
        userId,
      },
    });

    return count > 0;
  }

  async create(params: CreateUserSupportMessageParams, tx?: PrismaTx): Promise<UserSupportMessage> {
    const db = tx ?? this.prismaService;
    return db.userSupportMessage.create({ data: params });
  }

  async getById(id: number, userId: number, tx?: PrismaTx): Promise<UserSupportMessage | null> {
    const db = tx ?? this.prismaService;
    return db.userSupportMessage.findFirst({
      relationLoadStrategy: 'join',
      where: {
        id,
        userId,
      },
    });
  }

  async getAll(
    userId: number,
    params: UserSupportMessageQueryAllDto,
    tx?: PrismaTx,
  ): Promise<Pagination<UserSupportMessage>> {
    const db = tx ?? this.prismaService;
    const { page, pageSize, userSupportId } = params;

    const where: Prisma.UserSupportMessageWhereInput = {
      userId,
      userSupportId,
    };

    const [data, total] = await Promise.all([
      db.userSupportMessage.findMany({
        relationLoadStrategy: 'join',
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          createdAt: 'asc',
        },
        include: { userSupportImages: true },
      }),
      db.userSupportMessage.count({
        where,
      }),
    ]);

    return { total, data };
  }

  async updateById(
    id: number,
    userId: number,
    params: UpdateUserSupportMessageParams,
    tx?: PrismaTx,
  ): Promise<UserSupportMessage | null> {
    const db = tx ?? this.prismaService;

    const where: Prisma.UserSupportMessageWhereInput & Prisma.UserSupportMessageWhereUniqueInput = {
      id,
      userId,
    };

    const entity = await db.userSupportMessage.findUnique({ where });

    if (!entity) {
      return null;
    }

    return db.userSupportMessage.update({ where, data: params });
  }

  async deleteById(id: number, userId: number, tx?: PrismaTx): Promise<UserSupportMessage | null> {
    const db = tx ?? this.prismaService;

    const where: Prisma.UserSupportMessageWhereInput & Prisma.UserSupportMessageWhereUniqueInput = {
      id,
      userId,
    };

    const entity = await db.userSupportMessage.findUnique({ where });

    if (!entity) {
      return null;
    }

    return db.userSupportMessage.delete({ where });
  }
}
