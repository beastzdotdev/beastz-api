import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { FileMimeType, FileStructure } from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { constants } from '../../common/constants';
import { AuthPayloadType } from '../../model/auth.types';
import { FileStructureRepository } from './file-structure.repository';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { checkIfDirectoryExists, deleteFile, deleteFolder } from '../../common/helper';
import { IncreaseFileNameNumberMethodParams, ReplaceFileMethodParams } from './file-structure.type';
import {
  constFileStructureNameDuplicateRegex,
  extractNumber,
  fileStructureNameDuplicateRegex,
  fileStructureHelper,
  getUserRootContentPath,
} from './file-structure.helper';

@Injectable()
export class FileStructureService {
  private readonly logger = new Logger(FileStructureService.name);

  constructor(private readonly fileStructureRepository: FileStructureRepository) {}

  async getRootFiles(authPayload: AuthPayloadType) {
    return this.fileStructureRepository.getManyBy({
      depth: 0,
      userId: authPayload.user.id,
    });
  }

  async getById(authPayload: AuthPayloadType, id: number) {
    const fileStructure = await this.fileStructureRepository.getByIdForUser(id, authPayload.user.id);

    if (!fileStructure) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    return fileStructure;
  }

  async uploadFile(dto: UploadFileStructureDto, authPayload: AuthPayloadType) {
    const { file, parentId, rootParentId, replaceExisting, lastModifiedAt } = dto;

    const { parent } = await this.validateParentRootParentStructure({
      parentId,
      rootParentId,
    });

    const userId = authPayload.user.id;
    const isRoot = !parentId && !rootParentId;

    await this.checkStorageLimit(userId, file.size);

    // /something.jpeg -> something or something (1).jpg -> something (1)
    const parsedFile = path.parse(file.originalname);

    const title = replaceExisting
      ? parsedFile.name
      : await this.increaseFileNameNumber({ isFile: true, title: parsedFile.name, userId, parent });

    const fileNameWithExt = title + parsedFile.ext;

    let entityPath: string;
    let entityDepth: number;

    const userRootContentPath = getUserRootContentPath(authPayload.user.uuid);

    // Perform fs operation
    if (isRoot) {
      if (replaceExisting) {
        await this.replaceFileStructure({ title, userId, userRootContentPath, isFile: true });
      }

      const filePath = path.join(userRootContentPath, fileNameWithExt);

      // for fileStructure entity
      entityPath = '/' + fileNameWithExt;
      entityDepth = 0;

      this.logger.debug(`Is root: ${filePath}`);

      // if not exists create user uuid folder as well if not exists
      const folderCreationSuccess = await checkIfDirectoryExists(filePath, { isFile: true, createIfNotExists: true });

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
        await this.replaceFileStructure({ title, userId, userRootContentPath, parent, isFile: true });
      }

      const filePath = path.join(parent.path, fileNameWithExt);

      // for fileStructure entity
      entityPath = filePath;
      entityDepth = parent.depth + 1;

      this.logger.debug(`Is not root: ${filePath}`);

      const exists = await checkIfDirectoryExists(filePath, { isFile: true });

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
      lastModifiedAt: lastModifiedAt ?? null,

      //! important
      rootParentId: rootParentId ?? null,
      parentId: parentId ?? null,
      path: entityPath, // path from /user-content/{user uuid}/{ -> This is path (full path after uuid) <- }
      depth: entityDepth, // if root 0 or parent depth + 1
    });
  }

  async createFolder(dto: CreateFolderStructureDto, authPayload: AuthPayloadType) {
    const { name, parentId, rootParentId, replaceExisting } = dto;

    const { parent } = await this.validateParentRootParentStructure({
      parentId,
      rootParentId,
    });

    const userId = authPayload.user.id;
    const isRoot = !parentId && !rootParentId;
    const userRootContentPath = getUserRootContentPath(authPayload.user.uuid);

    const title = replaceExisting
      ? name
      : await this.increaseFileNameNumber({ title: name, userId, parent, isFile: false });

    let entityPath: string;
    let entityDepth: number;

    // Perform fs operation
    if (isRoot) {
      if (replaceExisting) {
        await this.replaceFileStructure({ title, userId, userRootContentPath, isFile: false });
      }

      const folderPath = path.join('/', title);

      // for fileStructure entity
      entityPath = folderPath;
      entityDepth = 0;

      this.logger.debug(`Is root: ${folderPath}`);

      // if not exists create user uuid folder as well if not exists
      const folderCreationSuccess = await checkIfDirectoryExists(path.join(userRootContentPath, folderPath), {
        isFile: false,
        createIfNotExists: true, // this will create desired folder
      });

      if (!folderCreationSuccess) {
        this.logger.debug('Folder creation error occured');
        throw new InternalServerErrorException('Something went wrong');
      }
    } else {
      if (!parent) {
        this.logger.debug(`This should not happen, tempParentFile mus not be null or undefined`);
        throw new InternalServerErrorException('Something went wrong');
      }

      if (replaceExisting) {
        await this.replaceFileStructure({ title, userId, userRootContentPath, parent, isFile: false });
      }

      const folderPath = path.join(parent.path, title);

      // for fileStructure entity
      entityPath = folderPath;
      entityDepth = parent.depth + 1;

      console.log('='.repeat(20));
      console.log(folderPath);
      console.log(entityDepth);

      this.logger.debug(`Is not root: ${folderPath}`);

      const folderCreationSuccess = await checkIfDirectoryExists(path.join(userRootContentPath, folderPath), {
        isFile: false,
        createIfNotExists: true, // this will create desired folder
      });

      if (!folderCreationSuccess) {
        this.logger.debug('Error happend in parent folder folder creation');
        throw new InternalServerErrorException('Something went wrong');
      }
    }

    return this.fileStructureRepository.create({
      title,
      color: null,
      sizeInBytes: null,
      userId: authPayload.user.id,
      fileExstensionRaw: null,
      mimeTypeRaw: null,
      mimeType: null,
      uuid: uuid(),
      isFile: false,
      isShortcut: false,
      isInBin: false,
      isEncrypted: false,
      isEditable: true,
      isLocked: false,
      deletedAt: null,
      lastModifiedAt: new Date(Date.now()),

      //! important
      rootParentId: rootParentId ?? null,
      parentId: parentId ?? null,
      path: entityPath, // path from /user-content/{user uuid}/{ -> This is path (full path after uuid) <- }
      depth: entityDepth, // if root 0 or parent depth + 1
    });
  }

  async getContentByParentId(authPayload: AuthPayloadType, parentId: number) {
    const fileStructure = await this.fileStructureRepository.getContentByParentId(parentId, authPayload.user.id);
    return fileStructure ?? [];
  }

  private async validateParentRootParentStructure(params: { parentId?: number; rootParentId?: number }) {
    const { parentId, rootParentId } = params;

    if ((parentId && !rootParentId) || (!parentId && rootParentId)) {
      throw new NotFoundException('parent id and root parent id must be set at the same time'); // this should not be handled
    }

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

    return {
      parent,
      rootParent,
    };
  }

  private async replaceFileStructure(params: ReplaceFileMethodParams): Promise<void> {
    const { title, userId, userRootContentPath, parent, isFile } = params;

    const sameNameFileStructure = await this.fileStructureRepository.getBy({
      depth: parent?.depth ?? 0, // either on depth or root
      title,
      isFile,
      userId,
    });

    if (sameNameFileStructure) {
      const delSameNameFileStructure = await this.fileStructureRepository.deleteById(sameNameFileStructure.id);

      const deletedSameNameFileStructurePath = !!parent
        ? delSameNameFileStructure.path
        : path.join(userRootContentPath, delSameNameFileStructure.path);

      const exists = await checkIfDirectoryExists(deletedSameNameFileStructurePath, {
        isFile,
      }); // no need for creation of folder

      if (!exists) {
        this.logger.debug('File should exists in file system');
        throw new InternalServerErrorException('Something went wrong');
      }

      isFile
        ? await deleteFile(deletedSameNameFileStructurePath)
        : await deleteFolder(deletedSameNameFileStructurePath);
    }
  }

  private async increaseFileNameNumber(params: IncreaseFileNameNumberMethodParams): Promise<string> {
    const { title, userId, parent, isFile } = params;

    const sameNameFileStructure = await this.fileStructureRepository.getBy({
      depth: parent?.depth ?? 0, // either on depth or root
      isFile,
      title,
      userId,
    });

    if (!sameNameFileStructure) {
      return title;
    }

    const titleStartsWith = fileStructureNameDuplicateRegex.test(title)
      ? title.split(' ').slice(0, -1).join(' ')
      : title;

    const sameNameFileStructures = await this.fileStructureRepository.getManyBy({
      depth: parent?.depth ?? 0, // either on depth or root
      isFile,
      userId,
      titleStartsWith,
    });

    const withRegexFilter = sameNameFileStructures.filter(e =>
      constFileStructureNameDuplicateRegex(titleStartsWith).test(e.title),
    );

    // this here happens when there are no names like "something (num)" and actually exists "something"
    if (!withRegexFilter.length) {
      return `${title} (1)`;
    }

    let finalNum = 0;
    const fileStructureNameNumber = extractNumber(title) || 0;

    // is sorted here number from low to high
    withRegexFilter
      .map(e => extractNumber(e.title))
      .filter(Boolean)
      .slice() // copy before mutation to avoid future mistakes
      .sort((a, b) => a - b)
      .forEach(number => {
        finalNum = fileStructureNameNumber > number ? fileStructureNameNumber : number;
      });

    return `${titleStartsWith} (${finalNum + 1})`;
  }

  private async checkStorageLimit(userId: number, extraSizeInBytes: number): Promise<void> {
    const totalFileSizeBeforeModify = await this.fileStructureRepository.getTotalFilesSize(userId);

    if (totalFileSizeBeforeModify + extraSizeInBytes > constants.MAX_STORAGE_PER_USER_IN_BYTES) {
      throw new ForbiddenException('Storage limit exceeds limit');
    }
  }
}
