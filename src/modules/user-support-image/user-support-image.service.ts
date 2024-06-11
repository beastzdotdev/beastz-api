import path from 'path';
import crypto from 'crypto';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { UserSupportImage } from '@prisma/client';
import { UserSupportImageRepository } from './user-support-image.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { DeleteUserSupportImageParams } from './user-support-image.type';
import { fsCustom } from '../../common/helper';
import { absUserSupportPath } from '../file-structure/file-structure.helper';
import { AuthPayloadType } from '../../model/auth.types';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class UserSupportImageService {
  private readonly logger = new Logger(UserSupportImageService.name);

  constructor(private readonly userSupportImageRepository: UserSupportImageRepository) {}

  async create(
    file: Express.Multer.File,
    params: {
      userId: number;
      userSupportMessageId: number;
      userSupportId: number;
    },
    authPayload: AuthPayloadType,
    tx?: PrismaTx,
  ): Promise<UserSupportImage> {
    const { userId, userSupportId, userSupportMessageId } = params;

    const nameUUID = crypto.randomUUID();
    const fullName = `${nameUUID}${path.extname(file.originalname) ?? ''}`;

    const absolutePath = path.join(absUserSupportPath(authPayload.user.uuid), fullName);

    // if not exists create user uuid folder as well if not exists
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(absolutePath, {
      isFile: true,
      createIfNotExists: true,
    });

    if (!folderCreationSuccess) {
      this.logger.debug('Folder creation error occured');
      throw new InternalServerErrorException('Something went wrong');
    }

    await fsCustom.writeFile(absolutePath, file.buffer).catch(err => {
      this.logger.debug('Error happend in root file creation');
      this.logger.error(err);

      throw new InternalServerErrorException('Something went wrong');
    });

    // no need to validate creation happens in user support message
    const response = await this.userSupportImageRepository.create(
      {
        nameUUID,
        path: path.join('/', fullName),
        userId,
        userSupportId,
        userSupportMessageId,
      },
      tx,
    );

    return response;
  }

  async deleteById(params: DeleteUserSupportImageParams, tx?: PrismaTx): Promise<void> {
    // no need to validate delete happens in user support message
    const response = await this.userSupportImageRepository.deleteById(params, tx);

    if (response === null) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_MESSAGE_NOT_FOUND);
    }
  }
}
