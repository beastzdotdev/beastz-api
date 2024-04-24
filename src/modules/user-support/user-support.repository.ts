import { Injectable } from '@nestjs/common';
import { Prisma, UserSupport } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { CreateUserSupportParams, UpdateUserSupportParams } from './user-support.type';
import { UserSupportQueryAllDto } from './dto/user-support-get-all-query.dto';
import { Pagination } from '../../model/types';

@Injectable()
export class UserSupportRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async existsById(id: number, userId: number, tx?: PrismaTx): Promise<boolean> {
    const db = tx ?? this.prismaService;

    const count = await db.userSupport.count({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  async create(params: CreateUserSupportParams, tx?: PrismaTx): Promise<UserSupport> {
    const db = tx ?? this.prismaService;
    return db.userSupport.create({ data: params });
  }

  async getById(id: number, userId: number, tx?: PrismaTx): Promise<UserSupport | null> {
    const db = tx ?? this.prismaService;
    return db.userSupport.findFirst({
      relationLoadStrategy: 'join',
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  async getAll(userId: number, params: UserSupportQueryAllDto, tx?: PrismaTx): Promise<Pagination<UserSupport>> {
    const db = tx ?? this.prismaService;
    const { page, pageSize, status } = params;

    const where: Prisma.UserSupportWhereInput = {
      status,
      userId,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      db.userSupport.findMany({
        relationLoadStrategy: 'join',
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          createdAt: 'asc',
        },
      }),
      db.userSupport.count({
        where,
      }),
    ]);

    return { total, data };
  }

  async updateById(
    id: number,
    userId: number,
    params: UpdateUserSupportParams,
    tx?: PrismaTx,
  ): Promise<UserSupport | null> {
    const db = tx ?? this.prismaService;

    const where: Prisma.UserSupportWhereInput & Prisma.UserSupportWhereUniqueInput = {
      id,
      userId,
      deletedAt: null,
    };

    const entity = await db.userSupport.findUnique({ where });

    if (!entity) {
      return null;
    }

    return db.userSupport.update({ where, data: params });
  }
}
