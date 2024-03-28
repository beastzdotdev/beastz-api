import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  async deleteUserInfo(userId: number) {
    return this.prismaService.$transaction(async tx => {
      const accountVerifys = await tx.accountVerification.findMany({ where: { userId } });
      const recoverPasswords = await tx.recoverPassword.findMany({ where: { userId } });

      const accountVerifyIds = accountVerifys.map(e => e.id);
      const recoverPasswordIds = recoverPasswords.map(e => e.id);

      await Promise.all([
        tx.refreshToken.deleteMany({ where: { userId } }),
        tx.userIdentity.deleteMany({ where: { userId } }),
        tx.feedback.deleteMany({ where: { userId } }),
      ]);

      await Promise.all([
        tx.recoverPasswordAttemptCount.deleteMany({ where: { id: { in: recoverPasswordIds } } }),
        tx.accountVerificationAttemptCount.deleteMany({ where: { id: { in: accountVerifyIds } } }),
      ]);

      await Promise.all([
        tx.recoverPassword.deleteMany({ where: { userId } }),
        tx.accountVerification.deleteMany({ where: { userId } }),
      ]);

      // last
      await tx.user.deleteMany({ where: { id: userId } });
    });
  }

  async blacklistUser(id: number, isLocked: boolean) {
    return this.prismaService.userIdentity.update({
      where: { userId: id },
      data: { isLocked },
    });
  }
}
