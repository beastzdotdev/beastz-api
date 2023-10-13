import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { ResetPassword } from '@prisma/client';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { CreateResetPasswordParams, UpdateResetPasswordParams } from './reset-password.type';

@Injectable()
export class ResetPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateResetPasswordParams): Promise<ResetPassword> {
    const { securityToken, userId, newPassword, jti } = params;

    return this.prismaService.resetPassword.create({
      data: {
        securityToken,
        userId,
        newPassword,
        jti,
      },
    });
  }

  async getById(id: number): Promise<ResetPassword | null> {
    return this.prismaService.resetPassword.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async getByJTI(jti: string): Promise<ResetPassword | null> {
    return this.prismaService.resetPassword.findFirst({
      where: {
        jti,
      },
    });
  }

  async getByUserId(userId: number): Promise<ResetPassword | null> {
    return this.prismaService.resetPassword.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async updateById(id: number, params: UpdateResetPasswordParams): Promise<ResetPassword | null> {
    const entity = await this.prismaService.resetPassword.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!entity) {
      return null;
    }

    return this.prismaService.resetPassword.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async softDelete(id: number) {
    return this.prismaService.resetPassword.update({
      where: { id },
      data: { deletedAt: moment().toDate() },
    });
  }
}
