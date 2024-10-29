import crypto from 'crypto';
import path from 'path';
import mime from 'mime';
import {
  Logger,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaTx } from '@global/prisma';
import { CreateUserParams, UserIncludeIdentity, UserWithRelations } from './user.type';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserRepository } from './user.repository';
import { UserBlockedException } from '../../exceptions/user-blocked.exception';
import { UserLockedException } from '../../exceptions/user-locked.exception';
import { ValidateUserForAccVerifyFlags } from '../authentication/authentication.types';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { UpdateUserProfileImageDto } from './dto/update-user-image.dto';
import { AuthPayloadType } from '../../model/auth.types';
import { fsCustom } from '../../common/helper';
import { absUserUploadPath } from '../file-structure/file-structure.helper';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async getByEmailIncludeIdentity(
    email: string,
    tx?: PrismaTx,
  ): Promise<UserIncludeIdentity<{ includesPassword: true }>> {
    const user = await this.userRepository.getByEmailIncludeIdentity(email, tx);

    if (!user || !user.userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return { ...user, userIdentity: user.userIdentity };
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async create(params: CreateUserParams, tx?: PrismaTx): Promise<UserWithRelations> {
    return this.userRepository.createUser(params, tx);
  }

  async getById(id: number): Promise<UserWithRelations> {
    const user = await this.userRepository.getById(id);

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user;
  }

  async getByIdIncludeIdentity(id: number, tx?: PrismaTx): Promise<UserIncludeIdentity<{ includesPassword: false }>> {
    const user = await this.userRepository.getByIdIncludeIdentity(id, tx);

    if (!user || !user.userIdentity) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return { ...user, userIdentity: user.userIdentity };
  }

  async getUserPasswordOnly(id: number, tx?: PrismaTx): Promise<string> {
    const user = await this.userRepository.getUserPasswordOnly(id, tx);

    if (!user || !user.userIdentity?.password) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user.userIdentity.password;
  }

  async getIdByEmail(email: string): Promise<number> {
    const userId = await this.userRepository.getIdByEmail(email);

    if (!userId) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return userId;
  }

  async getUUIDById(id: number): Promise<string> {
    const uuid = await this.userRepository.getUUIDById(id);

    if (!uuid) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return uuid;
  }

  async validateUserById(id: number): Promise<void> {
    const userExists = await this.userRepository.existsById(id);

    if (!userExists) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }
  }

  async update(id: number, params: UpdateUserDetailsDto): Promise<UserWithRelations> {
    const { userName, birthDate, gender } = params;

    const user = await this.userRepository.updateById(id, {
      userName,
      birthDate,
      gender,
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    return user;
  }

  async updateUserProfile(
    authPayload: AuthPayloadType,
    params: UpdateUserProfileImageDto,
    tx: PrismaTx,
  ): Promise<UserWithRelations> {
    const { profileImageFile } = params;

    const rawExt = mime.extension(profileImageFile.mimetype);
    const ext = `.${rawExt}`;

    const fileNameWithExt = 'profile-image-' + crypto.randomUUID() + ext;
    const filePath = path.join(absUserUploadPath(authPayload.user.uuid), fileNameWithExt);

    this.logger.debug(`Created file path and entity path`);
    this.logger.debug(filePath);

    // if not exists create user uuid folder as well if not exists
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(filePath, {
      isFile: true,
      createIfNotExists: true,
    });

    if (!folderCreationSuccess) {
      this.logger.debug('Folder creation error occured');
      throw new InternalServerErrorException('Something went wrong');
    }

    await fsCustom.writeFile(filePath, profileImageFile.buffer).catch(err => {
      this.logger.debug('Error happend');
      this.logger.error(err);

      throw new InternalServerErrorException('Something went wrong');
    });

    const entityRelativePath = path.join('/', fileNameWithExt);

    this.logger.debug(entityRelativePath);

    const user = await this.userRepository.updateById(
      authPayload.user.id,
      {
        profileImagePath: entityRelativePath,
      },
      tx,
    );

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
    }

    // del existing profile img if exists
    const existingPath = authPayload.user.profileImagePath;

    if (existingPath) {
      const existingAbsPath = path.join(absUserUploadPath(authPayload.user.uuid), existingPath);

      await fsCustom.access(existingAbsPath).catch(e => {
        this.logger.debug('Error happend');
        this.logger.error(e);

        throw new InternalServerErrorException('Something went wrong');
      });

      await fsCustom.delete(existingAbsPath).catch(e => {
        this.logger.debug('Error happend');
        this.logger.error(e);

        throw new InternalServerErrorException('Something went wrong');
      });
    }

    return user;
  }

  validateUser(
    user: UserIncludeIdentity<{ includesPassword: true }> | UserIncludeIdentity<{ includesPassword: false }>,
    flags?: ValidateUserForAccVerifyFlags,
  ) {
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
