import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ResetPassword } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { CreateResetPasswordParams, UpdateResetPasswordParams } from './reset-password.type';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class ResetPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateResetPasswordParams, tx?: PrismaTx): Promise<ResetPassword> {
    const db = tx ? tx : this.prismaService;
    const { securityToken, userId, newPassword, jti } = params;

    return db.resetPassword.create({
      data: {
        securityToken,
        userId,
        newPassword,
        jti,
      },
    });
  }

  async getById(id: number, tx?: PrismaTx): Promise<ResetPassword | null> {
    const db = tx ? tx : this.prismaService;
    return db.resetPassword.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<ResetPassword | null> {
    const db = tx ? tx : this.prismaService;
    return db.resetPassword.findFirst({
      where: {
        jti,
      },
    });
  }

  async getByUserId(
    userId: number,
    tx?: PrismaTx,
    flags?: { includeDeleted?: boolean },
  ): Promise<ResetPassword | null> {
    const db = tx ? tx : this.prismaService;
    return db.resetPassword.findFirst({
      where: {
        userId,
        ...(!flags?.includeDeleted && { deletedAt: null }),
      },
    });
  }

  async updateById(id: number, params: UpdateResetPasswordParams, tx?: PrismaTx): Promise<ResetPassword | null> {
    const db = tx ? tx : this.prismaService;
    const entity = await db.resetPassword.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      return null;
    }

    return db.resetPassword.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number, tx?: PrismaTx): Promise<ResetPassword> {
    const db = tx ? tx : this.prismaService;
    return db.resetPassword.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
