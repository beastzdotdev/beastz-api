import { Injectable } from '@nestjs/common';
import { RefreshTokenRepository } from './refresh-token.repository';
import { CreateRefreshTokenParams } from './refresh-token.type';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async getUserIdByRefreshToken(refreshToken: string): Promise<number | null> {
    const userId = await this.refreshTokenRepository.getUserIdByValue(refreshToken);

    if (!userId) {
      return null;
    }

    return userId;
  }

  async clearRefreshTokensForUser(userId: number): Promise<void> {
    return this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  async addRefreshTokenByUserId(params: CreateRefreshTokenParams) {
    await this.refreshTokenRepository.createEntity(params);
  }

  async deleteRefreshToken(refreshToken: string) {
    return this.refreshTokenRepository.deleteByValue(refreshToken);
  }
}
