import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import sanitizeHtml from 'sanitize-html';
import sanitizeFileName from 'sanitize-filename';
import { FileMimeType, FileStructure, FileStructureBin } from '@prisma/client';
import {
  BadRequestException,
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
import { IncreaseFileNameNumberMethodParams, ReplaceFileMethodParams } from './file-structure.type';
import { GetDuplicateStatusQueryDto } from './dto/get-duplicate-status-query.dto';
import { GetDuplicateStatusResponseDto } from './dto/response/get-duplicate-status-response.dto';
import { GetFileStructureContentQueryDto } from './dto/get-file-structure-content-query.dto';
import { GetGeneralInfoQueryDto } from './dto/get-general-info-query.dto';
import { UpdateFolderStructureDto } from './dto/update-folder-structure.dto';
import { batchPromises, fsCustom } from '../../common/helper';
import { FileStructureBinService } from '../file-structure-bin/file-structure-bin.service';
import { RestoreFromBinDto } from './dto/restore-from-bin.dto';
import { PrismaService } from '../@global/prisma/prisma.service';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { FileStructureRawQueryRepository } from './file-structure-raw-query.repositor';
import {
  constFileStructureNameDuplicateRegex,
  extractNumber,
  fileStructureNameDuplicateRegex,
  fileStructureHelper,
  getAbsUserRootContentPath,
  makeTreeSingle,
  getAbsUserBinPath,
  makeTreeMultiple,
} from './file-structure.helper';

@Injectable()
export class FileStructureService {
  private readonly logger = new Logger(FileStructureService.name);

  constructor(
    private readonly prismaService: PrismaService,

    private readonly fsRepository: FileStructureRepository,
    private readonly fsRawQueryRepository: FileStructureRawQueryRepository,
    private readonly fileStructureBinService: FileStructureBinService,
  ) {}

  async getContent(authPayload: AuthPayloadType, queryParams: GetFileStructureContentQueryDto) {
    const { parentId, isFile } = queryParams;

    if (Object.values(queryParams).length === 0) {
      const response = await this.fsRawQueryRepository.recursiveSelect({
        userId: authPayload.user.id,
        depth: 5,
        parentId: null,
        inBin: false,
      });

      return makeTreeMultiple(response);
    }

    const response = await this.fsRawQueryRepository.recursiveSelect({
      userId: authPayload.user.id,
      depth: 2,
      parentId: parentId ?? null,
      isFile,
      inBin: false,
    });

    return makeTreeMultiple(response);
  }

  async getGeneralInfo(authPayload: AuthPayloadType, queryParams: GetGeneralInfoQueryDto) {
    const {} = queryParams; // for future use

    const totalSize = await this.fsRepository.getTotalFilesSize(authPayload.user.id, {});

    return {
      totalSize,
    };
  }

  async getDuplicateStatus(
    authPayload: AuthPayloadType,
    queryParams: GetDuplicateStatusQueryDto,
  ): Promise<GetDuplicateStatusResponseDto[]> {
    const { titles, isFile, parentId } = queryParams;
    const fileStructures: GetDuplicateStatusResponseDto[] = [];

    for (const title of titles) {
      if (title !== sanitizeHtml(title) || title !== sanitizeFileName(title)) {
        this.logger.debug(`File name invalid ${title}`);
        throw new BadRequestException('File name invalid');
      }

      const fileStructure = await this.fsRepository.getBy({
        isFile,
        title: path.parse(title).name,
        parentId: parentId ?? null,
        userId: authPayload.user.id,
      });

      fileStructures.push({
        title,
        hasDuplicate: !!fileStructure,
      });
    }

    return fileStructures;
  }

  async getById(authPayload: AuthPayloadType, id: number) {
    const fileStructure = await this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id });

    if (!fileStructure) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    return fileStructure;
  }

  async uploadFile(dto: UploadFileStructureDto, authPayload: AuthPayloadType) {
    const { file, parentId, rootParentId, keepBoth, lastModifiedAt } = dto;

    const { parent } = await this.validateParentRootParentStructure({
      parentId,
      rootParentId,
    });

    const userId = authPayload.user.id;
    const isRoot = !parentId && !rootParentId;

    await this.checkStorageLimit(userId, file.size);

    // /something.jpeg -> something or something (1).jpg -> something (1)
    const parsedFile = path.parse(file.originalname);

    const title = !keepBoth
      ? parsedFile.name
      : await this.increaseFileNameNumber({ isFile: true, title: parsedFile.name, userId, parent });

    const fileNameWithExt = title + parsedFile.ext;

    let entityPath: string;
    let entityDepth: number;

    const userRootContentPath = getAbsUserRootContentPath(authPayload.user.uuid);

    // Perform fs operation
    if (isRoot) {
      // for fileStructure entity
      entityPath = path.join('/', fileNameWithExt);
      entityDepth = 0;

      if (!keepBoth) {
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: true });
      }

      //! Must be after assigning entityPath
      const absolutePath = path.join(userRootContentPath, entityPath);

      this.logger.debug(`Is root: ${absolutePath}`);

      // if not exists create user uuid folder as well if not exists
      const folderCreationSuccess = await fsCustom.checkDirOrCreate(absolutePath, {
        isFile: true,
        createIfNotExists: true,
      });

      if (!folderCreationSuccess) {
        this.logger.debug('Folder creation error occured');
        throw new InternalServerErrorException('Something went wrong');
      }

      // this should have no problem
      //TODO
      await fs.promises
        .writeFile(path.join(userRootContentPath, entityPath), file.buffer, { encoding: 'utf-8' })
        .catch(err => {
          this.logger.debug('Error happend in root file creation');
          this.logger.error(err);

          throw new InternalServerErrorException('Something went wrong');
        });
    } else {
      if (!parent) {
        this.logger.debug(`This should not happen, tempParentFile mus not be null or undefined`);
        throw new InternalServerErrorException('Something went wrong');
      }

      // for fileStructure entity
      entityPath = path.join(parent.path, fileNameWithExt);
      entityDepth = parent.depth + 1;

      if (!keepBoth) {
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: true });
      }

      //! Must be after assigning entityPath
      const absolutePath = path.join(userRootContentPath, entityPath);

      this.logger.debug(`Is not root: ${absolutePath}`);

      const exists = await fsCustom.checkDirOrCreate(absolutePath, { isFile: true });

      if (!exists) {
        this.logger.debug('Error happend in parent file folder check');
        throw new InternalServerErrorException('Something went wrong');
      }

      // here create only file in existing directory
      await fs.promises.writeFile(absolutePath, file.buffer, { encoding: 'utf-8' }).catch(err => {
        this.logger.debug('Error happend in parent file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    }

    return this.fsRepository.create({
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
    const { name, parentId, rootParentId, keepBoth } = dto;

    if (name !== sanitizeHtml(name) || name !== sanitizeFileName(name)) {
      this.logger.debug(`File name invalid ${name}`);
      throw new BadRequestException('File name invalid');
    }

    const { parent } = await this.validateParentRootParentStructure({
      parentId,
      rootParentId,
    });

    const userId = authPayload.user.id;
    const isRoot = !parentId && !rootParentId;
    const userRootContentPath = getAbsUserRootContentPath(authPayload.user.uuid);

    const title = !keepBoth ? name : await this.increaseFileNameNumber({ title: name, userId, parent, isFile: false });

    let entityPath: string;
    let entityDepth: number;

    // Perform fs operation
    if (isRoot) {
      // for fileStructure entity
      entityPath = path.join('/', title);
      entityDepth = 0;

      if (!keepBoth) {
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: false });
      }

      //! Must be after assigning entityPath
      const absolutePath = path.join(userRootContentPath, entityPath);

      this.logger.debug(`Is root: ${absolutePath}`);

      // if not exists create user uuid folder as well if not exists
      const folderCreationSuccess = await fsCustom.checkDirOrCreate(absolutePath, {
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

      // for fileStructure entity
      entityPath = path.join(parent.path, title);
      entityDepth = parent.depth + 1;

      if (!keepBoth) {
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: false });
      }

      //! Must be after assigning entityPath
      const absolutePath = path.join(userRootContentPath, entityPath);

      this.logger.debug(`Is not root: ${absolutePath}`);

      const folderCreationSuccess = await fsCustom.checkDirOrCreate(absolutePath, {
        isFile: false,
        createIfNotExists: true, // this will create desired folder
      });

      if (!folderCreationSuccess) {
        this.logger.debug('Error happend in parent folder folder creation');
        throw new InternalServerErrorException('Something went wrong');
      }
    }

    return this.fsRepository.create({
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

  async update(id: number, dto: UpdateFolderStructureDto, authPayload: AuthPayloadType): Promise<FileStructure> {
    const fileStructure = await this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id });

    if (!fileStructure) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    const response = await this.fsRepository.updateByIdAndReturn(id, dto, { userId: authPayload.user.id });

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.INTERNAL_ERROR);
    }

    return response;
  }

  async moveToBin(id: number, authPayload: AuthPayloadType): Promise<FileStructureBin> {
    const fs = await this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id });

    if (!fs) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    if (fs.isInBin) {
      throw new BadRequestException('File is already in bin'); // should not happend from frontend
    }

    // update all descendants is_in_bin
    await this.fsRawQueryRepository.recursiveUpdateIsInBin(id, true);

    const nameUUID = uuid();
    const nameWithExt = nameUUID + (fs.fileExstensionRaw ?? '');
    const relativePath = path.join('/', nameWithExt);

    const sourceContentPath = path.join(getAbsUserRootContentPath(authPayload.user.uuid), fs.path);
    const destinationBinPath = path.join(getAbsUserBinPath(authPayload.user.uuid), nameWithExt);

    // if not exists create user uuid folder as well if not exists
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(destinationBinPath, {
      isFile: fs.isFile,
      createIfNotExists: true,
    });

    if (!folderCreationSuccess) {
      this.logger.debug('Folder creation error occured');
      throw new InternalServerErrorException('Something went wrong');
    }

    // move folder/file to user-bin
    await fsCustom.move(sourceContentPath, destinationBinPath);

    // add to fs bin
    const response = await this.fileStructureBinService.create({
      userId: fs.userId,
      fileStructureId: fs.id,
      path: relativePath,
      nameUUID,
    });

    return response;
  }

  async restoreFromBin(id: number, dto: RestoreFromBinDto, authPayload: AuthPayloadType): Promise<FileStructure> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const { newParentId } = dto;

      const [fs, fsBin, newParentFs] = await Promise.all([
        this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id, isInBin: true }, tx),
        this.fileStructureBinService.getByFsId(id, authPayload.user.id, tx),
        newParentId ? this.fsRepository.getByIdForUser(newParentId, { userId: authPayload.user.id }, tx) : null,
      ]);

      if (!fs) {
        throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
      }

      if (!fs.isInBin) {
        throw new BadRequestException('File is not in bin');
      }

      if (newParentId !== null) {
        if (!newParentFs) {
          throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
        }

        if (newParentFs.isInBin) {
          throw new BadRequestException('File is already in bin'); // should not happend from frontend
        }

        if (newParentFs.isFile) {
          throw new BadRequestException('Parent should be folder');
        }
      }

      // here we have verified that fs is in bin and exists as well parent fs exists and not in bin and is not file
      // and fs in bin entity exists
      const newPath = path.join(...[newParentFs?.path, '/', fs.title + (fs.fileExstensionRaw ?? '')].filter(Boolean));

      // under same parent same folder or file name is disqualified no need to add whether fs is file or not because of path
      const sameFs = await this.fsRepository.getByPathUnderDir(newParentId, newPath, authPayload.user.id, tx);

      if (sameFs) {
        throw new BadRequestException(ExceptionMessageCode.FS_SAME_NAME);
      }

      // delete from fs bin
      await this.fileStructureBinService.deleteById(fsBin.id, authPayload.user.id, tx);

      const updatedFs = await this.fsRepository.updateByIdAndReturn(
        fs.id,
        {
          depth: newParentFs ? newParentFs.depth + 1 : 0,
          isInBin: false,
          path: newPath,
          rootParentId: newParentFs ? newParentFs.rootParentId : null,
          parentId: newParentFs ? newParentFs.id : null,
        },
        {
          userId: authPayload.user.id,
          isInBin: true,
        },
        tx,
      );

      if (!fs.isFile) {
        // root parent is no longer in bin in this transaction session but not children
        const fsChildren = await this.fsRawQueryRepository.recursiveSelect(
          {
            userId: authPayload.user.id,
            id: fs.id,
            inBinRootOnly: false,
            inBinChildrenOnly: true,
            notReturnRootItemId: updatedFs.id,
          },
          tx,
        );

        const depthDifference = updatedFs.depth - fs.depth; // can be both positive and negative

        const promises = fsChildren.map(child => {
          const f = newParentFs?.rootParentId ? newParentFs.rootParentId : newParentFs?.id; // null is never for children
          const finalRootParentId = newParentFs ? f : fs.id;

          // console.log(`depth ${child.depth} -> ${child.depth + depthDifference}`);
          // console.log(`isInBin ${child.isInBin} -> ${false}`);
          // console.log(`rootParentId ${child.rootParentId} -> ${finalRootParentId}`);
          // console.log(`path ${child.path} -> ${child.path.replace(fs.path, newPath)}`);
          // console.log('='.repeat(20));

          return this.fsRepository.updateById(
            child.id,
            {
              depth: child.depth + depthDifference,
              isInBin: false,
              rootParentId: finalRootParentId,
              path: child.path.replace(fs.path, newPath), // replace old parent path with new path
            },
            {
              userId: authPayload.user.id,
              isInBin: true,
            },
            tx,
          );
        });

        await batchPromises(promises, 15);
      }

      // move from user-bin back to new user-content path
      await fsCustom.move(
        path.join(getAbsUserBinPath(authPayload.user.uuid), fsBin.path), // source path,
        path.join(getAbsUserRootContentPath(authPayload.user.uuid), newPath), // source path
      );

      return updatedFs;
    });
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
        this.fsRepository.getById(parentId),
        this.fsRepository.getById(rootParentId),
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
    const { path: fileOrFolderPath, userId, userRootContentPath, isFile } = params;

    const sameNameFileStructure = await this.fsRepository.getBy({
      isFile,
      userId,
      path: fileOrFolderPath,
    });

    if (sameNameFileStructure) {
      if (isFile) {
        await this.fsRepository.deleteById(sameNameFileStructure.id);
      } else {
        await this.fsRawQueryRepository.recursiveDelete(sameNameFileStructure.id);
      }

      const absolutePath = path.join(userRootContentPath, sameNameFileStructure.path);
      const exists = await fsCustom.checkDirOrCreate(absolutePath, { isFile }); // no need for creation of folder

      if (!exists) {
        this.logger.debug('File should exists in file system');
        throw new InternalServerErrorException('Something went wrong');
      }

      fsCustom.delete(absolutePath);

      // isFile ? await deleteFile(absolutePath) : await deleteFolder(absolutePath);
    }
  }

  private async increaseFileNameNumber(params: IncreaseFileNameNumberMethodParams): Promise<string> {
    const { title, userId, parent, isFile } = params;

    const sameNameFileStructure = await this.fsRepository.getBy({
      parentId: parent?.id,
      isFile,
      userId,
      //
      title, // we need exact match first
    });

    if (!sameNameFileStructure) {
      return title;
    }

    // extract starting point before enumeration if there is one
    const titleStartsWith = fileStructureNameDuplicateRegex.test(title)
      ? title.split(' ').slice(0, -1).join(' ')
      : title;

    const sameNameFileStructures = await this.fsRepository.getManyBy({
      parentId: parent?.id,
      isFile,
      userId,
      //
      titleStartsWith,
    });

    let finalNum = 0;
    const fileStructureNameNumber = extractNumber(title);

    // sameNameFileStructures at least contain itself so length will always have min 1
    sameNameFileStructures
      .filter(e => constFileStructureNameDuplicateRegex(titleStartsWith).test(e.title))
      .filter(Boolean)
      .map(e => extractNumber(e.title))
      .slice() // copy before mutation to avoid future mistakes
      .sort((a, b) => a - b)
      .forEach(number => {
        finalNum = fileStructureNameNumber > number ? fileStructureNameNumber : number;
      });

    return `${titleStartsWith} (${finalNum + 1})`;
  }

  private async checkStorageLimit(userId: number, extraSizeInBytes: number): Promise<void> {
    const totalFileSizeBeforeModify = await this.fsRepository.getTotalFilesSize(userId, {});

    if (totalFileSizeBeforeModify + extraSizeInBytes > constants.MAX_STORAGE_PER_USER_IN_BYTES) {
      throw new ForbiddenException('Storage limit exceeds limit');
    }
  }
}
