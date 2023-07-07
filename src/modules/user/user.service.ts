import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserParams, UpdateUserParams, UserWithRelations } from './user.type';
import { User } from '@prisma/client';

import { ExceptionMessageCode } from '../../exceptions/exception-message-code.enum';
import { RefreshTokenRepository } from '../authentication/refresh-token/refresh-token.repository';
import { UserRepository } from './user.repository';
import { RandomService } from '../../common/modules/random/random.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly randomService: RandomService,
  ) {}

  async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.getByEmail(email);
  }

  async findByRefreshToken(refreshToken: string): Promise<UserWithRelations | null> {
    const userId = await this.refreshTokenRepository.getUserIdByValue(refreshToken);

    if (!userId) {
      return null;
    }

    return this.userRepository.getById(userId);
  }

  async clearRefreshTokensForUser(userId: number): Promise<void> {
    return this.refreshTokenRepository.deleteAllByUserId(userId);
  }

  async addRefreshTokenByUserId(userId: number, value: string) {
    await this.refreshTokenRepository.createEntity({
      userId,
      value,
    });
  }

  async deleteRefreshToken(refreshToken: string) {
    return this.refreshTokenRepository.deleteByValue(refreshToken);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async create(params: Omit<CreateUserParams, 'socketId'>): Promise<UserWithRelations> {
    const socketId = this.randomService.generateRandomHEX(32);

    return this.userRepository.createUser({ ...params, socketId });
  }

  async getById(id: number): Promise<UserWithRelations> {
    const user = await this.userRepository.getById(id);

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user;
  }

  async getIdByEmail(email: string): Promise<number> {
    const userId = await this.userRepository.getIdByEmail(email);

    if (!userId) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return userId;
  }

  async validateUserById(id: number): Promise<void> {
    const userExists = await this.userRepository.existsById(id);

    if (!userExists) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }
  }

  async updateById(id: number, params: UpdateUserParams): Promise<UserWithRelations> {
    const user = await this.userRepository.updateById(id, {
      userName: params.userName,
      birthDate: params.birthDate,
      email: params.email,
      gender: params.gender,
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user;
  }

  async updateOnlineStatus(id: number, status: boolean) {
    return this.userRepository.updateOnlineStatus(id, status);
  }

  async getUserSocketIdByIds(ids: number[]): Promise<string[]> {
    return this.userRepository.getSocketIdByIds(ids);
  }

  async getSocketIdById(id: number): Promise<string> {
    return (await this.userRepository.getSocketIdById(id)) as string;
  }
}
