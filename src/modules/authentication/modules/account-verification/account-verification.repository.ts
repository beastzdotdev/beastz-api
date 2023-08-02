import { Injectable } from '@nestjs/common';
import { AccountVerificationParams } from './account-verification.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class AccountVerificationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(params: AccountVerificationParams) {
    return this.prismaService.accountVerification.upsert({
      where: {
        userId: params.userId,
      },
      update: {
        oneTimeCode: params.oneTimeCode,
      },
      create: params,
    });
  }

  async getByUserId(userId: number) {
    return this.prismaService.accountVerification.findFirst({
      where: { userId },
    });
  }
}
