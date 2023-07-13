import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { CreateRefreshTokenParams } from './refresh-token.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEntity(params: CreateRefreshTokenParams): Promise<RefreshToken> {
    return this.prismaService.refreshToken.create({
      data: {
        userId: params.userId,
        token: params.token,
        sub: params.sub,
        iss: params.iss,
        platform: params.platform,
        secretKeyEncrypted: params.secretKeyEncrypted,
        jti: params.jti,
        cypherIV: params.cypherIV,
        exp: params.exp.toString(),
        iat: params.iat.toString(),
      },
    });
  }

  async getByJTI(jti: string): Promise<RefreshToken | null> {
    return this.prismaService.refreshToken.findFirst({
      where: { jti },
    });
  }

  async deleteAllByUserId(userId: number): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteByValue(value: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      // where: {
      //   value,
      // },
    });
  }
}
