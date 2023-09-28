import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { CreateResetPasswordParams } from './reset-password.type';
import { ResetPassword } from '@prisma/client';

@Injectable()
export class ResetPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(params: CreateResetPasswordParams): Promise<ResetPassword> {
    const { userId, userIdentityId } = params;

    return this.prismaService.resetPassword.create({
      data: {
        userId,
        userIdentityId,
      },
    });
  }
}
