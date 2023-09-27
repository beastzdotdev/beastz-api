import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { RecoverPassword } from '@prisma/client';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class RecoverPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateRecoverPasswordParams): Promise<RecoverPassword> {
    const { securityToken, userId, newPassword, jti } = params;

    return this.prismaService.recoverPassword.create({
      data: {
        securityToken,
        userId,
        newPassword,
        jti,
      },
    });
  }

  async getById(id: number): Promise<RecoverPassword | null> {
    return this.prismaService.recoverPassword.findFirst({
      where: {
        id,
      },
    });
  }

  async getByJTI(jti: string): Promise<RecoverPassword | null> {
    return this.prismaService.recoverPassword.findFirst({
      where: {
        jti,
      },
    });
  }

  async getByUserId(userId: number): Promise<RecoverPassword | null> {
    return this.prismaService.recoverPassword.findFirstOrThrow({
      where: {
        userId,
        NOT: {
          deletedAt: null,
        },
      },
    });
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams): Promise<RecoverPassword | null> {
    const entity = await this.prismaService.recoverPassword.findUnique({ where: { id } });

    if (!entity) {
      return null;
    }

    return this.prismaService.recoverPassword.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.recoverPassword.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
