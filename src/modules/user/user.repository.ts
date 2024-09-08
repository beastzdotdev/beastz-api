import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import { CreateUserParams, UpdateUserParams, UserWithRelations } from './user.type';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async getByEmailIncludeIdentity(email: string, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.user.findUnique({
      relationLoadStrategy: 'join',
      where: { email },
      select: {
        id: true,
        uuid: true,
        email: true,
        createdAt: true,
        userIdentity: {
          select: {
            id: true,
            isAccountVerified: true,
            isBlocked: true,
            strictMode: true,
            isLocked: true,
            password: true,
          },
        },
      },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({ where: { email } });

    return count > 0;
  }

  async createUser(params: CreateUserParams, tx?: PrismaTx): Promise<User> {
    const db = tx ?? this.prismaService;

    return db.user.create({ data: params });
  }

  async getById(id: number): Promise<UserWithRelations | null> {
    return this.prismaService.user.findFirst({
      relationLoadStrategy: 'join',
      where: { id },
      select: {
        id: true,
        createdAt: true,
        userName: true,
        email: true,
        gender: true,
        birthDate: true,
        uuid: true,
        profileImagePath: true,
        // firstName: true,
        // lastName: true,
      },
    });
  }

  async getByIdIncludeIdentity(id: number, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.user.findFirst({
      relationLoadStrategy: 'join',
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        uuid: true,
        profileImagePath: true,
        userIdentity: {
          select: {
            id: true,
            isAccountVerified: true,
            isBlocked: true,
            isLocked: true,
            strictMode: true,
          },
        },
      },
    });
  }

  async getUserPasswordOnly(id: number, tx?: PrismaTx) {
    const db = tx ?? this.prismaService;

    return db.user.findFirst({
      relationLoadStrategy: 'join',
      where: { id },
      select: {
        id: true,
        userIdentity: {
          select: {
            id: true,
            password: true,
          },
        },
      },
    });
  }

  async getIdByEmail(email: string): Promise<number | null> {
    const result = await this.prismaService.user.findFirst({
      relationLoadStrategy: 'join',
      where: { email },
      select: { id: true },
    });

    return result?.id ?? null;
  }

  async existsById(id: number): Promise<boolean> {
    const count = await this.prismaService.user.count({ where: { id } });

    return count > 0;
  }

  async updateById(id: number, params: UpdateUserParams, tx?: PrismaTx): Promise<User | null> {
    const db = tx ?? this.prismaService;
    const entity = await db.user.findUnique({ where: { id } });

    if (!entity) {
      return null;
    }

    return db.user.update({
      where: { id },
      data: {
        ...entity,
        ...params,
      },
    });
  }
}
