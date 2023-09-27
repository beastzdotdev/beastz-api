import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async deleteUserInfo(userId: number) {
    return this.prismaService.$transaction(async tx => {
      const accountVerifys = await this.prismaService.accountVerification.findMany({ where: { userId } });
      const recoverPasswords = await this.prismaService.recoverPassword.findMany({ where: { userId } });

      const accountVerifyIds = accountVerifys.map(e => e.id);
      const recoverPasswordIds = recoverPasswords.map(e => e.id);

      await Promise.all([
        this.prismaService.accountVerification.deleteMany({ where: { userId } }),
        this.prismaService.recoverPassword.deleteMany({ where: { userId } }),
        this.prismaService.refreshToken.deleteMany({ where: { userId } }),
        this.prismaService.userIdentity.deleteMany({ where: { userId } }),
        this.prismaService.feedback.deleteMany({ where: { userId } }),
      ]);

      await Promise.all([
        this.prismaService.accountVerificationAttemptCount.deleteMany({ where: { id: { in: accountVerifyIds } } }),
        this.prismaService.recoverPasswordAttemptCount.deleteMany({ where: { id: { in: recoverPasswordIds } } }),
      ]);

      // last
      this.prismaService.user.deleteMany({ where: { id: userId } });
    });
  }
}
