import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { AccountVerification } from '@prisma/client';
import { CreateAccountVerificationParams, UpdateAccountVerificationParams } from './account-verification.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class AccountVerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getByUserId(
    userId: number,
    tx?: PrismaTx,
    flags?: { includeDeleted?: boolean },
  ): Promise<AccountVerification | null> {
    const db = tx ? tx : this.prismaService;

    return db.accountVerification.findFirst({
      where: {
        userId,
        ...(!flags?.includeDeleted && { deletedAt: null }),
      },
    });
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<AccountVerification | null> {
    const db = tx ? tx : this.prismaService;

    return db.accountVerification.findFirst({
      where: {
        jti,
      },
    });
  }

  async create(params: CreateAccountVerificationParams, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;
    const { securityToken, userId, jti } = params;

    return db.accountVerification.create({
      data: {
        securityToken,
        userId,
        jti,
      },
    });
  }

  async updateById(id: number, params: UpdateAccountVerificationParams, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;

    const entity = await db.accountVerification.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      return null;
    }

    return db.accountVerification.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number, tx?: PrismaTx) {
    const db = tx ? tx : this.prismaService;

    return db.accountVerification.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
