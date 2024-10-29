import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { RecoverPassword } from '@prisma/client';
import { PrismaService, PrismaTx } from '@global/prisma';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';

@Injectable()
export class RecoverPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateRecoverPasswordParams, tx?: PrismaTx): Promise<RecoverPassword> {
    const db = tx ?? this.prismaService;

    const { securityToken, userId, newPassword, jti } = params;

    return db.recoverPassword.create({
      data: {
        securityToken,
        userId,
        newPassword,
        jti,
      },
    });
  }

  async getById(id: number, tx?: PrismaTx): Promise<RecoverPassword | null> {
    const db = tx ?? this.prismaService;

    return db.recoverPassword.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<RecoverPassword | null> {
    const db = tx ?? this.prismaService;

    return db.recoverPassword.findFirst({
      where: {
        jti,
      },
    });
  }

  async getByUserId(
    userId: number,
    tx?: PrismaTx,
    flags?: { includeDeleted?: boolean },
  ): Promise<RecoverPassword | null> {
    const db = tx ?? this.prismaService;

    return db.recoverPassword.findFirst({
      where: {
        userId,
        ...(!flags?.includeDeleted && { deletedAt: null }),
      },
    });
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams, tx?: PrismaTx): Promise<RecoverPassword | null> {
    const db = tx ?? this.prismaService;

    const entity = await db.recoverPassword.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      return null;
    }

    return db.recoverPassword.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number, tx?: PrismaTx): Promise<RecoverPassword> {
    const db = tx ?? this.prismaService;

    return db.recoverPassword.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
