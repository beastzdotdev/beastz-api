import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserParams, UpdateUserParams, UserIncludeIdentity, UserWithRelations } from './user.type';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserRepository } from './user.repository';
import { UserBlockedException } from '../../exceptions/user-blocked.exception';
import { UserLockedException } from '../../exceptions/user-locked.exception';
import { ValidateUserForAccVerifyFlags } from '../authentication/authentication.types';
import { random } from '../../common/random';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getByEmailIncludeIdentity(email: string): Promise<UserIncludeIdentity> {
    const user = await this.userRepository.getByEmailIncludeIdentity(email);

    if (!user || !user.userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return { ...user, userIdentity: user.userIdentity };
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async create(params: Omit<CreateUserParams, 'socketId'>, tx?: PrismaTx): Promise<UserWithRelations> {
    const socketId = random.generateRandomHEX(32);

    return this.userRepository.createUser({ ...params, socketId }, tx);
  }

  async getById(id: number): Promise<UserWithRelations> {
    const user = await this.userRepository.getById(id);

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user;
  }

  async getByIdIncludeIdentity(id: number, tx?: PrismaTx): Promise<UserIncludeIdentity> {
    const user = await this.userRepository.getByIdIncludeIdentity(id, tx);

    if (!user || !user.userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return { ...user, userIdentity: user.userIdentity };
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

  validateUser(user: UserIncludeIdentity, flags?: ValidateUserForAccVerifyFlags) {
    if (!user) {
      throw new UnauthorizedException(ExceptionMessageCode.EMAIL_OR_PASSWORD_INVALID);
    }

    if (user.userIdentity.isBlocked) {
      throw new UserBlockedException();
    }

    if (user.userIdentity.isLocked) {
      throw new UserLockedException();
    }

    if (flags?.showIsVerifiedErr && user.userIdentity.isAccountVerified) {
      throw new ForbiddenException(ExceptionMessageCode.USER_ALREADY_VERIFIED);
    }

    if (flags?.showNotVerifiedErr && !user.userIdentity.isAccountVerified) {
      throw new ForbiddenException(ExceptionMessageCode.USER_NOT_VERIFIED);
    }
  }
}
