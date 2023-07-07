import { CreateUserParams, UpdateUserParams, UserWithRelations } from './user.type';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async getByEmailIncludeIdentity(email: string): Promise<UserWithRelations | null> {
    return this.prismaService.user.findUnique({
      where: { email },
      include: { userIdentity: true },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({ where: { email } });

    return count > 0;
  }

  async createUser(params: CreateUserParams): Promise<User> {
    return this.prismaService.user.create({ data: params });
  }

  async getById(id: number): Promise<UserWithRelations | null> {
    return this.prismaService.user.findFirst({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        userName: true,
        email: true,
        gender: true,
        birthDate: true,
        isOnline: true,
        profileImagePath: true,
      },
    });
  }

  async getIdByEmail(email: string): Promise<number | null> {
    const result = await this.prismaService.user.findFirst({
      where: { email },
      select: { id: true },
    });

    return result?.id ?? null;
  }

  // async updatePasswordById(id: number, newHashedPassword: string) {
  //   return this.prismaService.user.update({
  //     where: { id },
  //     data: { passwordHash: newHashedPassword },
  //   });
  // }

  async existsById(id: number): Promise<boolean> {
    const count = await this.prismaService.user.count({ where: { id } });

    return count > 0;
  }

  async updateById(id: number, params: UpdateUserParams): Promise<User | null> {
    const entity = await this.prismaService.user.findUnique({ where: { id } });

    if (!entity) {
      return null;
    }

    return this.prismaService.user.update({
      where: { id },
      data: {
        ...entity,
        ...params,
      },
    });
  }

  async updateOnlineStatus(id: number, status: boolean) {
    return this.prismaService.user.updateMany({
      where: { id },
      data: { isOnline: status },
    });
  }

  async getSocketIdByIds(ids: number[]): Promise<string[]> {
    const result = await this.prismaService.user.findMany({
      where: { id: { in: ids } },
      select: { socketId: true },
    });

    return result.map(e => e.socketId);
  }

  async getSocketIdById(id: number): Promise<string | null> {
    const result = await this.prismaService.user.findUnique({
      where: { id },
      select: { socketId: true },
    });

    return result?.socketId ?? null;
  }
}
