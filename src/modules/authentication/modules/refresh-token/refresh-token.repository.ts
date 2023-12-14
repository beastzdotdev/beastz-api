import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { CreateRefreshTokenParams } from './refresh-token.type';
import { PrismaService } from '../../../@global/prisma/prisma.service';
import { PrismaTx } from '../../../@global/prisma/prisma.type';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createEntity(params: CreateRefreshTokenParams, tx?: PrismaTx): Promise<RefreshToken> {
    const db = tx ?? this.prismaService;

    return db.refreshToken.create({
      data: {
        userId: params.userId,
        token: params.token,
        sub: params.sub,
        iss: params.iss,
        platform: params.platform,
        jti: params.jti,
        exp: params.exp.toString(),
        iat: params.iat.toString(),
      },
    });
  }

  async getByJTI(jti: string, tx?: PrismaTx): Promise<RefreshToken | null> {
    const db = tx ?? this.prismaService;
    return db.refreshToken.findFirst({ where: { jti } });
  }

  async deleteById(id: number, tx?: PrismaTx): Promise<void> {
    const db = tx ?? this.prismaService;
    await db.refreshToken.deleteMany({ where: { id } });
  }

  async deleteAllByUserId(userId: number, tx?: PrismaTx): Promise<void> {
    const db = tx ?? this.prismaService;
    await db.refreshToken.deleteMany({ where: { userId } });
  }
}
