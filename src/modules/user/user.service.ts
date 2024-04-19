import fs from 'fs';
import path from 'path';
import {
  Logger,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserParams, UserIncludeIdentity, UserWithRelations } from './user.type';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { UserRepository } from './user.repository';
import { UserBlockedException } from '../../exceptions/user-blocked.exception';
import { UserLockedException } from '../../exceptions/user-locked.exception';
import { ValidateUserForAccVerifyFlags } from '../authentication/authentication.types';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { UpdateUserProfileImageDto } from './dto/update-user-image.dto';
import { AuthPayloadType } from '../../model/auth.types';
import { constants } from '../../common/constants';
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

  async updateUserProfile(authPayload: AuthPayloadType, params: UpdateUserProfileImageDto): Promise<UserWithRelations> {
    const { profileImageFile } = params;

    // /something.jpeg -> something or something (1).jpg -> something (1)
    const parsedFile = path.parse(profileImageFile.originalname);

    const newFileName = `profile-image${parsedFile.ext}`;

    const filePath = path.join(absUserUploadPath(authPayload.user.uuid), newFileName);
    const entityPath = path.join('/', constants.assets.userUploadFolderName, authPayload.user.uuid, newFileName);

    this.logger.debug(`Created file path and entity path`);
    this.logger.debug(filePath);
    this.logger.debug(entityPath);

    // if not exists create user uuid folder as well if not exists
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(filePath, {
      isFile: true,
      createIfNotExists: true,
    });

    if (!folderCreationSuccess) {
      this.logger.debug('Folder creation error occured');
      throw new InternalServerErrorException('Something went wrong');
    }

    // this should have no problem
    await fs.promises.writeFile(filePath, profileImageFile.buffer, { encoding: 'utf-8' }).catch(err => {
      this.logger.debug('Error happend');
      this.logger.error(err);

      throw new InternalServerErrorException('Something went wrong');
    });

    const user = await this.userRepository.updateById(authPayload.user.id, {
      profileImagePath: entityPath,
    });

    if (!user) {
      throw new NotFoundException(ExceptionMessageCode.USER_NOT_FOUND);
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
