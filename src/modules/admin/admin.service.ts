import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async deleteUserInfo(userId: number) {
    return this.prismaService.$transaction([
      this.prismaService.accountVerification.deleteMany({ where: { userId } }),
      this.prismaService.accountVerificationAttemptCount.deleteMany({ where: { userId } }),
      this.prismaService.recoverPassword.deleteMany({ where: { userId } }),
      this.prismaService.recoverPasswordAttemptCount.deleteMany({ where: { userId } }),
      this.prismaService.refreshToken.deleteMany({ where: { userId } }),
      this.prismaService.userIdentity.deleteMany({ where: { userId } }),
      this.prismaService.feedback.deleteMany({ where: { userId } }),

      // last
      this.prismaService.user.deleteMany({ where: { id: userId } }),
    ]);
  }
}
