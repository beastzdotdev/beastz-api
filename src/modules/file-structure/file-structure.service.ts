import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FileMimeType, FileStructure } from '@prisma/client';

import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileStructureRepository } from './file-structure.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { checkIfDirectoryExists, deleteFile } from '../../common/helper';
import { AuthPayloadType } from '../../model/auth.types';
import { IncreaseFileNameNumberMethodParams, ReplaceFileMethodParams } from './file-structure.type';
import {
  constantFileNameDuplicateRegex,
  extractNumber,
  fileNameDuplicateRegex,
  fileStructureHelper,
  getUserRootContentPath,
} from './file-structure.helper';
import { constants } from '../../common/constants';

@Injectable()
export class FileStructureService {
  private readonly logger = new Logger(FileStructureService.name);

  constructor(private readonly fileStructureRepository: FileStructureRepository) {}

  async uploadFile(dto: UploadFileStructureDto, authPayload: AuthPayloadType) {
    const { file, parentId, rootParentId, replaceExisting } = dto;

    if ((parentId && !rootParentId) || (!parentId && rootParentId)) {
      throw new NotFoundException('parent id and root parent id must be set at the same time'); // this should not be handled
    }

    const isRoot = !parentId && !rootParentId;

    let parent: FileStructure | null | undefined;
    let rootParent: FileStructure | null | undefined;

    // if this file has parentId then check if folder exists with this id (refering to parentId)
    if (parentId && rootParentId) {
      [parent, rootParent] = await Promise.all([
        this.fileStructureRepository.getById(parentId),
        this.fileStructureRepository.getById(rootParentId),
      ]);

      if (!parent) {
        throw new NotFoundException(ExceptionMessageCode.PARENT_FOLDER_NOT_FOUND);
      }

      if (parent.isFile) {
        throw new NotFoundException(ExceptionMessageCode.PARENT_CANNOT_BE_FILE);
      }

      if (!rootParent) {
        throw new NotFoundException(ExceptionMessageCode.ROOT_PARENT_FOLDER_NOT_FOUND);
      }

      if (rootParent.isFile) {
        throw new NotFoundException(ExceptionMessageCode.ROOT_PARENT_CANNOT_BE_FILE);
      }
    }

    // /something.jpeg -> something or something (1)
    const parsedFile = path.parse(file.originalname);

    const title = replaceExisting
      ? parsedFile.name
      : await this.increaseFileNameNumber({
          title: parsedFile.name,
          userId: authPayload.user.id,
          parent,
        });

    const fileNameWithExt = title + parsedFile.ext;

    let entityPath: string;
    let entityDepth: number;

    const userRootContentPath = getUserRootContentPath(authPayload.user.uuid);

    await this.checkStorageLimit(authPayload.user.id, file.size);

    // Perform fs operation
    if (isRoot) {
      if (replaceExisting) {
        await this.replaceFile({
          title,
          userId: authPayload.user.id,
          userRootContentPath,
        });
      }

      const filePath = path.join(userRootContentPath, fileNameWithExt);

      // for fileStructure entity
      entityPath = '/' + fileNameWithExt;
      entityDepth = 0;

      this.logger.debug(`Is root: ${filePath}`);

      // if not exists create user uuid folder as well if not exists
      const folderCreationSuccess = await checkIfDirectoryExists(filePath, { createIfNotExists: true });

      if (!folderCreationSuccess) {
        this.logger.debug('Folder creation error occured');
        throw new InternalServerErrorException('Something went wrong');
      }

      // this should have no problem
      await fs.promises.writeFile(filePath, file.buffer, { encoding: 'utf-8' }).catch(err => {
        this.logger.debug('Error happend in root file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    } else {
      if (!parent) {
        this.logger.debug(`This should not happen, tempParentFile mus not be null or undefined`);
        throw new InternalServerErrorException('Something went wrong');
      }

      if (replaceExisting) {
        await this.replaceFile({
          title,
          userId: authPayload.user.id,
          userRootContentPath,
          parent: parent,
        });
      }

      const filePath = path.join(parent.path, fileNameWithExt);

      // for fileStructure entity
      entityPath = filePath;
      entityDepth = parent.depth + 1;

      this.logger.debug(`Is not root: ${filePath}`);

      const exists = await checkIfDirectoryExists(filePath);

      if (!exists) {
        this.logger.debug('Error happend in parent file folder check');
        throw new InternalServerErrorException('Something went wrong');
      }

      // here create only file in existing directory
      await fs.promises.writeFile(filePath, file.buffer, { encoding: 'utf-8' }).catch(err => {
        this.logger.debug('Error happend in parent file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    }

    return this.fileStructureRepository.create({
      title,
      color: null,
      userId: authPayload.user.id,
      sizeInBytes: file.size,
      fileExstensionRaw: parsedFile.ext,
      mimeTypeRaw: file.mimetype,
      mimeType: fileStructureHelper.fileTypeRawMimeToEnum[file.mimetype] ?? FileMimeType.OTHER,
      uuid: uuid(),
      isFile: true,
      isShortcut: false,
      isInBin: false,
      isEncrypted: false,
      isEditable: true,
      isLocked: false,
      deletedAt: null,
      lastModifiedAt: null,

      //! important
      rootParentId: rootParentId ?? null,
      parentId: parentId ?? null,
      path: entityPath, // path from /user-content/{user uuid}/{ -> This is path (full path after uuid) <- }
      depth: entityDepth, // if root 0 or parent depth + 1
    });
  }

  private async replaceFile(params: ReplaceFileMethodParams): Promise<void> {
    const { title, userId, userRootContentPath, parent } = params;

    const sameNameFile = await this.fileStructureRepository.getBy({
      depth: parent?.depth ?? 0, // either on depth or root
      title,
      isFile: true,
      userId: userId,
    });

    if (sameNameFile) {
      const deletedSameNameFile = await this.fileStructureRepository.deleteById(sameNameFile.id);

      const deletedSameNameFilePath = !!parent
        ? deletedSameNameFile.path
        : path.join(userRootContentPath, deletedSameNameFile.path);

      const exists = await checkIfDirectoryExists(deletedSameNameFilePath);

      if (!exists) {
        this.logger.debug('File should exists in file system');
        throw new InternalServerErrorException('Something went wrong');
      }

      await deleteFile(deletedSameNameFilePath);
    }
  }

  private async increaseFileNameNumber(params: IncreaseFileNameNumberMethodParams): Promise<string> {
    const { title, userId, parent } = params;

    const sameNameFile = await this.fileStructureRepository.getBy({
      depth: parent?.depth ?? 0, // either on depth or root
      isFile: true,
      title,
      userId,
    });

    if (!sameNameFile) {
      return title;
    }

    const titleStartsWith = fileNameDuplicateRegex.test(title) ? title.split(' ').slice(0, -1).join(' ') : title;
    const sameNameFiles = await this.fileStructureRepository.getManyBy({
      depth: parent?.depth ?? 0, // either on depth or root
      isFile: true,
      userId,
      titleStartsWith,
    });

    const withRegexFilter = sameNameFiles.filter(e => constantFileNameDuplicateRegex(titleStartsWith).test(e.title));

    // this here happens when there are no names like "something (num)" and actually exists "something"
    if (!withRegexFilter.length) {
      return `${title} (1)`;
    }

    let finalFileNumber = 0;
    const fileNameNumber = extractNumber(title) || 0;

    // is sorted here number from low to high
    withRegexFilter
      .map(e => extractNumber(e.title))
      .filter(Boolean)
      .slice() // copy before mutation to avoid future mistakes
      .sort((a, b) => a - b)
      .forEach(number => {
        finalFileNumber = fileNameNumber > number ? fileNameNumber : number;
      });

    return `${titleStartsWith} (${finalFileNumber + 1})`;
  }

  private async checkStorageLimit(userId: number, extraSizeInBytes: number): Promise<void> {
    const totalFileSizeBeforeModify = await this.fileStructureRepository.getTotalFilesSize(userId);

    if (!totalFileSizeBeforeModify) {
      this.logger.debug('Somehow user does not exist in order to get total file size');
      throw new InternalServerErrorException('Something went wrong');
    }

    if (totalFileSizeBeforeModify + extraSizeInBytes > constants.MAX_STORAGE_PER_USER_IN_BYTES) {
      throw new ForbiddenException('Storage limit exceeds limit');
    }
  }
}
