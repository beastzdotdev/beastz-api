import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaTx } from '@global/prisma';
import { RefreshTokenRepository } from './refresh-token.repository';
import { CreateRefreshTokenParams } from './refresh-token.type';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async getByJTI(id: string, tx?: PrismaTx): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.getByJTI(id, tx);
  }

  async deleteAllByUserId(userId: number, tx?: PrismaTx): Promise<void> {
    return this.refreshTokenRepository.deleteAllByUserId(userId, tx);
  }

  async addRefreshTokenByUserId(params: CreateRefreshTokenParams, tx?: PrismaTx): Promise<RefreshToken> {
    return this.refreshTokenRepository.createEntity(params, tx);
  }

  async deleteById(id: number, tx?: PrismaTx): Promise<void> {
    await this.refreshTokenRepository.deleteById(id, tx);
  }

  async deleteByJTI(jti: string, tx?: PrismaTx): Promise<RefreshToken> {
    return this.refreshTokenRepository.deleteByJTI(jti, tx);
  }
}
