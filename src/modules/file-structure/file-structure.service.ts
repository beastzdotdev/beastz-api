import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { FileMimeType, FileStructure } from '@prisma/client';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileStructureRepository } from './file-structure.repository';
import {
  constantFileNameDuplicateRegex,
  extractNumber,
  fileNameDuplicateRegex,
  fileStructureHelper,
  getUserRootContentPath,
} from './file-structure.helper';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { checkIfDirectoryExists, deleteFile } from '../../common/helper';
import { AuthPayloadType } from '../../model/auth.types';

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

    let tempParentFile: FileStructure | null | undefined;
    let tempRootFolder: FileStructure | null | undefined;

    // if this file has parentId then check if folder exists with this id (refering to parentId)
    if (parentId && rootParentId) {
      [tempParentFile, tempRootFolder] = await Promise.all([
        this.fileStructureRepository.getById(parentId),
        this.fileStructureRepository.getById(rootParentId),
      ]);

      if (!tempParentFile) {
        throw new NotFoundException(ExceptionMessageCode.PARENT_FOLDER_NOT_FOUND);
      }

      if (tempParentFile.isFile) {
        throw new NotFoundException(ExceptionMessageCode.PARENT_CANNOT_BE_FILE);
      }

      if (!tempRootFolder) {
        throw new NotFoundException(ExceptionMessageCode.ROOT_PARENT_FOLDER_NOT_FOUND);
      }

      if (tempRootFolder.isFile) {
        throw new NotFoundException(ExceptionMessageCode.ROOT_PARENT_CANNOT_BE_FILE);
      }
    }

    // /something.jpeg -> something or something (1)
    const parsedFile = path.parse(file.originalname);

    const title = replaceExisting
      ? parsedFile.name
      : //TODO here check if is not root file
        //TODO here check if is not root file
        //TODO here check if is not root file
        //TODO here check if is not root file
        //TODO here check if is not root file
        //TODO here check if is not root file, use same method just needs different depth
        await this.increaseRootFileNameNumber({
          title: parsedFile.name,
          userId: authPayload.user.id,
        });

    const fileNameWithExt = title + parsedFile.ext;

    let entityPath: string;
    let entityDepth: number;

    const userRootContentPath = getUserRootContentPath(authPayload.user.uuid);

    // Perform fs operation
    if (isRoot) {
      if (replaceExisting) {
        await this.replaceRootFile({
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
      //TODO replace existing needs implementing use same method just needs chaniging path and depth
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id

      if (!tempParentFile) {
        this.logger.debug(`This should not happen, tempParentFile mus not be null or undefined`);
        throw new InternalServerErrorException('Something went wrong');
      }

      const filePath = path.join(tempParentFile.path, fileNameWithExt);

      // for fileStructure entity
      entityPath = filePath;
      entityDepth = tempParentFile.depth + 1;

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
      sizeInBytes: BigInt(file.size),
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

  private async replaceRootFile(params: { title: string; userId: number; userRootContentPath: string }) {
    const { title, userId, userRootContentPath } = params;

    const sameNameFileOnRoot = await this.fileStructureRepository.getBy({
      depth: 0,
      title,
      isFile: true,
      userId: userId,
    });

    if (sameNameFileOnRoot) {
      const deletedSameNameFileOnRoot = await this.fileStructureRepository.deleteById(sameNameFileOnRoot.id);

      const deletedSameNameFilePath = path.join(userRootContentPath, deletedSameNameFileOnRoot.path);
      const exists = await checkIfDirectoryExists(deletedSameNameFilePath);

      if (!exists) {
        this.logger.debug('Root file should exists in file system');
        throw new InternalServerErrorException('Something went wrong');
      }

      await deleteFile(deletedSameNameFilePath);
    }
  }

  private async increaseRootFileNameNumber(params: { title: string; userId: number }): Promise<string> {
    const { title, userId } = params;

    const sameNameFileOnRoot = await this.fileStructureRepository.getBy({
      depth: 0,
      isFile: true,
      title,
      userId,
    });

    if (!sameNameFileOnRoot) {
      return title;
    }

    const titleStartsWith = fileNameDuplicateRegex.test(title) ? title.split(' ').slice(0, -1).join(' ') : title;
    const sameNameFilesOnRoot = await this.fileStructureRepository.getManyBy({
      depth: 0,
      isFile: true,
      userId,
      titleStartsWith,
    });

    const withRegexFilter = sameNameFilesOnRoot.filter(e =>
      constantFileNameDuplicateRegex(titleStartsWith).test(e.title),
    );

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
}
