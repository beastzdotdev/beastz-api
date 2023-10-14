import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { RefreshTokenRepository } from './refresh-token.repository';
import { CreateRefreshTokenParams } from './refresh-token.type';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async getByJTI(id: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.getByJTI(id);
  }

  async deleteAllByUserId(userId: number): Promise<void> {
    return this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  async addRefreshTokenByUserId(params: CreateRefreshTokenParams) {
    await this.refreshTokenRepository.createEntity(params);
  }

  async deleteById(id: number): Promise<void> {
    await this.refreshTokenRepository.deleteById(id);
  }
}
