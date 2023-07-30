import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenRepository } from './refresh-token.repository';
import { CreateRefreshTokenParams } from './refresh-token.type';
import { RefreshToken } from '@prisma/client';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async getByJTI(id: string): Promise<RefreshToken> {
    const token = await this.refreshTokenRepository.getByJTI(id);

    if (!token) {
      throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
    }

    return token;
  }

  async clearRefreshTokensForUser(userId: number): Promise<void> {
    return this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  async addRefreshTokenByUserId(params: CreateRefreshTokenParams) {
    await this.refreshTokenRepository.createEntity(params);
  }

  async updateIsUsedById(id: number) {
    await this.refreshTokenRepository.updateIsUsedById(id);
  }

  async updateIsUsedForAllByUserId(userId: number) {
    await this.refreshTokenRepository.updateIsUsedForAllByUserId(userId);
  }
}
