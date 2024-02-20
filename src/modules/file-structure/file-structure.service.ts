import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-html';
import { v4 as uuid } from 'uuid';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { FileMimeType, FileStructure } from '@prisma/client';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileStructureRepository } from './file-structure.repository';
import { fileStructureHelper, getUserRootContentPath } from './file-structure.helper';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { checkIfDirectoryExists } from '../../common/helper';
import { AuthPayloadType } from '../../model/auth.types';

@Injectable()
export class FileStructureService {
  private readonly logger = new Logger(FileStructureService.name);

  constructor(private readonly fileStructureRepository: FileStructureRepository) {}

  async uploadFile(dto: UploadFileStructureDto, authPayload: AuthPayloadType) {
    const { file, parentId, rootParentId } = dto;

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

    const fileName = sanitize(file.originalname);
    const splited = fileName.split('.');
    let entityPath: string;
    let entityDepth: number;

    //TODO unsafe file does not work from downloads (writes as .jpeg), check that as well

    // Perform fs operation
    if (isRoot) {
      //TODO here to check identicall names for comparison read all root files from database

      const userRootContentPath = getUserRootContentPath(authPayload.user.uuid);
      const filePath = path.join(userRootContentPath, fileName);

      // for fileStructure entity
      entityPath = '/' + fileName;
      entityDepth = 0;

      this.logger.debug(`Is root: ${filePath}`);

      // if not exists create user uuid folder as well if not exists
      await checkIfDirectoryExists(filePath, { createIfNotExists: true });

      // this should have no problem
      await fs.promises.writeFile(filePath, file.buffer, { encoding: 'utf-8' }).catch(err => {
        this.logger.debug('Error happend in root file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    } else {
      //TODO here to check identicall names for comparison read all files with same depth from database and parent id

      if (!tempParentFile) {
        this.logger.debug(`This should not happen, tempParentFile mus not be null or undefined`);
        throw new InternalServerErrorException('Something went wrong');
      }

      const filePath = path.join(tempParentFile.path, fileName);

      // for fileStructure entity
      entityPath = filePath;
      entityDepth = tempParentFile.depth + 1;

      this.logger.debug(`Is not root: ${filePath}`);

      await checkIfDirectoryExists(filePath).catch(err => {
        this.logger.debug('Error happend in parent file folder check');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });

      // here create only file in existing directory
      await fs.promises.writeFile(filePath, file.buffer, { encoding: 'utf-8' }).catch(err => {
        this.logger.debug('Error happend in parent file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    }

    return this.fileStructureRepository.create({
      title: file.originalname,
      color: null,
      userId: authPayload.user.id,
      sizeInBytes: BigInt(file.size),
      fileExstensionRaw: splited.length >= 2 ? splited[splited.length - 1] : null,
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
}
