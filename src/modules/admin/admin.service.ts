import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';
import { getAbsUserBinPath, getAbsUserRootContentPath } from '../file-structure/file-structure.helper';
import { fsCustom } from '../../common/helper';

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

  async deleteUserFsInfo(userId: number) {
    return this.prismaService.$transaction(async tx => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      // turn this up code in promise all
      const [allBinFs, allFs] = await Promise.all([
        tx.fileStructureBin.findMany({ where: { userId } }),
        tx.fileStructure.findMany({ where: { userId } }),
      ]);

      const allBinFsIds = allBinFs.map(e => e.id);
      const allFsIds = allFs.map(e => e.id);

      await tx.fileStructureBin.deleteMany({ where: { id: { in: allBinFsIds } } });

      // must be after
      await tx.fileStructure.deleteMany({ where: { id: { in: allFsIds } } });

      const userRootContentPath = getAbsUserRootContentPath(user.uuid);
      const userRootBinPath = getAbsUserBinPath(user.uuid);

      await Promise.all([
        //
        fsCustom.delete(userRootContentPath),
        fsCustom.delete(userRootBinPath),
      ]);
    });
  }

  async blacklistUser(id: number, isLocked: boolean) {
    return this.prismaService.userIdentity.update({
      where: { userId: id },
      data: { isLocked },
    });
  }
}
