import { Injectable } from '@nestjs/common';
import { AccountVerificationParams } from './account-verification.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class AccountVerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(params: AccountVerificationParams) {
    const { securityToken, userId } = params;

    return this.prismaService.accountVerification.upsert({
      where: { userId },
      update: { securityToken },
      create: params,
    });
  }

  async getByUserId(userId: number) {
    return this.prismaService.accountVerification.findFirst({
      where: { userId },
    });
  }
}
