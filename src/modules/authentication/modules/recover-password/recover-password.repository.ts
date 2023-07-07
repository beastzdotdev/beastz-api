import { Injectable } from '@nestjs/common';
import { RecoverPassword } from '@prisma/client';
import { CreateRecoverPasswordParams, UpdateRecoverPasswordParams } from './recover-password.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class RecoverPasswordRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert(params: CreateRecoverPasswordParams): Promise<RecoverPassword> {
    return this.prismaService.recoverPassword.upsert({
      where: {
        userId: params.userId,
      },
      update: params,
      create: params,
    });
  }

  async getByUUID(uuid: string): Promise<RecoverPassword | null> {
    return this.prismaService.recoverPassword.findFirst({
      where: {
        uuid,
      },
    });
  }

  async getByUserId(userId: number): Promise<RecoverPassword | null> {
    return this.prismaService.recoverPassword.findUnique({ where: { userId } });
  }

  async updateById(id: number, params: UpdateRecoverPasswordParams): Promise<RecoverPassword | null> {
    const entity = await this.prismaService.recoverPassword.findUnique({ where: { id } });

    if (!entity) {
      return null;
    }

    return this.prismaService.recoverPassword.update({
      where: { id },
      data: { ...entity, ...params },
    });
  }

  async deleteById(uuid: string) {
    return this.prismaService.recoverPassword.delete({
      where: { uuid },
    });
  }
}
