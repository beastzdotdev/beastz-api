import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { CreateAccountVerificationParams, UpdateAccountVerificationParams } from './account-verification.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { AccountVerification } from '@prisma/client';

@Injectable()
export class AccountVerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async getByUserId(userId: number): Promise<AccountVerification | null> {
    return this.prismaService.accountVerification.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async getByJTI(jti: string): Promise<AccountVerification | null> {
    return this.prismaService.accountVerification.findFirst({
      where: {
        jti,
      },
    });
  }

  async create(params: CreateAccountVerificationParams) {
    const { securityToken, userId, jti } = params;

    return this.prismaService.accountVerification.create({
      data: {
        securityToken,
        userId,
        jti,
      },
    });
  }

  async updateById(id: number, params: UpdateAccountVerificationParams) {
    const entity = await this.prismaService.accountVerification.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      return null;
    }

    return this.prismaService.accountVerification.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.accountVerification.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
