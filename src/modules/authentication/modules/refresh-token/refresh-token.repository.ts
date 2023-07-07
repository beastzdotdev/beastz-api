import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { CreateRefreshTokenParams } from './refresh-token.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEntity(params: CreateRefreshTokenParams): Promise<RefreshToken> {
    return this.prismaService.refreshToken.create({ data: params });
  }

  async getUserIdByValue(value: string): Promise<number | null> {
    const result = await this.prismaService.refreshToken.findFirst({
      where: { value },
      select: { userId: true },
    });

    return result?.userId ?? null;
  }

  async deleteAllByUserId(userId: number): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteByValue(value: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({ where: { value } });
  }
}
