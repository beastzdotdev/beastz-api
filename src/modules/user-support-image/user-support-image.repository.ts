import { Injectable } from '@nestjs/common';
import { UserSupportImage } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import { CreateUserSupportImageParams, DeleteUserSupportImageParams } from './user-support-image.type';

@Injectable()
export class UserSupportImageRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateUserSupportImageParams, tx?: PrismaTx): Promise<UserSupportImage> {
    const db = tx ?? this.prismaService;
    return db.userSupportImage.create({ data: params });
  }

  async deleteById(params: DeleteUserSupportImageParams, tx?: PrismaTx): Promise<UserSupportImage | null> {
    const db = tx ?? this.prismaService;

    const entity = await db.userSupportImage.findUnique({ where: params });

    if (!entity) {
      return null;
    }

    return db.userSupportImage.delete({ where: params });
  }
}
