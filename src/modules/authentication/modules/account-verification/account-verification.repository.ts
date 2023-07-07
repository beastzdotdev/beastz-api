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

  async getIsVerifiedByUserId(userId: number): Promise<boolean | null> {
    const result = await this.prismaService.accountVerification.findUnique({
      where: { userId },
      select: { isVerified: true },
    });

    return result?.isVerified ?? null;
  }

  async updateIsVerified(userId: number, isVerified: boolean) {
    return this.prismaService.accountVerification.update({
      where: { userId },
      data: { isVerified },
    });
  }
}
