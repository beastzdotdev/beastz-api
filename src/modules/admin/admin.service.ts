import { Injectable } from '@nestjs/common';
import { UserSupportMessage, UserSupportTicketStatus } from '@prisma/client';
import { PrismaService } from '../@global/prisma/prisma.service';
import { fsCustom } from '../../common/helper';
import { absUserBinPath, absUserContentPath } from '../file-structure/file-structure.helper';
import { GetSupportTicketsQueryDto } from './dto/get-support-tickets-query.dto';
import { UpdateSupportTicketDto } from './dto/update-support-tickets.dto';

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

      const userRootContentPath = absUserContentPath(user.uuid);
      const userRootBinPath = absUserBinPath(user.uuid);

      console.log(userRootContentPath);
      console.log(userRootBinPath);

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

  async answerTicket(params: { userId: number; supportId: number; message: string }): Promise<UserSupportMessage> {
    const { message, supportId, userId } = params;

    return this.prismaService.$transaction(async tx => {
      const support = await tx.userSupport.findUniqueOrThrow({
        where: {
          id: supportId,
          userId,
        },
      });

      if (!support) {
        throw new Error('Support not found');
      }

      return tx.userSupportMessage.create({
        data: {
          fromAdmin: true,
          text: message,
          userId,
          userSupportId: supportId,
        },
      });
    });
  }

  async getTickets(params: GetSupportTicketsQueryDto) {
    const { status, userId, id, getMessages, title, uuid } = params;

    return this.prismaService.userSupport.findMany({
      where: {
        id,
        userId,
        status: status ?? UserSupportTicketStatus.PENDING,
        title,
        uuid,
      },
      orderBy: {
        createdAt: 'desc',
      },

      ...(getMessages && {
        include: { userSupportMessages: true, userSupportImages: true },
      }),
    });
  }

  async updateTicket(id: number, dto: UpdateSupportTicketDto) {
    const { userId, status } = dto;

    return this.prismaService.userSupport.update({
      where: {
        id,
        userId,
      },
      data: {
        status,
      },
    });
  }
}
