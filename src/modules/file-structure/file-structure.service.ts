import path from 'path';
import moment from 'moment';
import mime from 'mime';
import sanitizeHtml from 'sanitize-html';
import sanitizeFileName from 'sanitize-filename';
import { v4 as uuid } from 'uuid';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { EncryptionAlgorithm, EncryptionType, FileMimeType, FileStructure, FileStructureBin } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
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
  makeTreeMultiple,
  absUserBinPath,
  absUserContentPath,
  absUserDeletedForeverPath,
  absUserTempFolderZipPath,
} from './file-structure.helper';
import { GetDetailsQueryDto } from './dto/get-details-query.dto';
import { UploadEncryptedFileStructureDto } from './dto/upload-encrypted-file-structure.dto';
import { FileStructureEncryptionService } from '../file-structure-encryption/file-structure-encryption.service';
import { ReplaceTextFileStructure } from './dto/replace-text-file-structure';
import { SearchFileStructureQueryDto } from './dto/search-file-structure-query.dto';

@Injectable()
export class FileStructureService {
  private readonly logger = new Logger(FileStructureService.name);

  constructor(
    private readonly prismaService: PrismaService,

    private readonly fsRepository: FileStructureRepository,
    private readonly fsRawQueryRepository: FileStructureRawQueryRepository,
    private readonly fsBinService: FileStructureBinService,
    private readonly fsEncryptionService: FileStructureEncryptionService,
  ) {}

  async search(authPayload: AuthPayloadType, queryParams: SearchFileStructureQueryDto) {
    return this.fsRepository.search(queryParams.search, { userId: authPayload.user.id });
  }

  async getContent(authPayload: AuthPayloadType, queryParams: GetFileStructureContentQueryDto) {
    const { parentId, isFile } = queryParams;

    if (Object.values(queryParams).length === 0) {
      const response = await this.fsRawQueryRepository.recursiveSelect({
        userId: authPayload.user.id,
        depth: 4, // 5 level folder structure
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
    const { items, isFile, parentId } = queryParams;
    const fileStructures: GetDuplicateStatusResponseDto[] = [];

    for (const item of items) {
      const { mimeTypeRaw, title } = item;

      if (title !== sanitizeHtml(title) || title !== sanitizeFileName(title)) {
        this.logger.debug(`File name invalid ${title}`);
        throw new BadRequestException('File name invalid');
      }

      const parsedFile = path.parse(title);

      const fileStructure = await this.fsRepository.getBy({
        isFile,
        title: parsedFile.name,
        parentId: parentId ?? null,
        mimeTypeRaw,
        userId: authPayload.user.id,
      });

      fileStructures.push({
        title,
        hasDuplicate: !!fileStructure,
      });
    }

    return fileStructures;
  }

  async getDetails(authPayload: AuthPayloadType, queryParams: GetDetailsQueryDto): Promise<FileStructure[]> {
    const { ids, isInBin } = queryParams;

    const existsByIds = await this.fsRepository.existsByIds(ids, {
      userId: authPayload.user.id,
      isInBin,
    });

    if (!existsByIds.allIdsExist) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND, {
        description: `ids not found ${existsByIds.notFoundIds}`,
      });
    }

    const fileStructures = await this.fsRepository.getByIdsForUser(ids, {
      userId: authPayload.user.id,
      isInBin,
    });

    for (const fs of fileStructures) {
      if (!fs.isFile) {
        const absPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
        fs.sizeInBytes = (await fsCustom.getFolderSize(absPath)) ?? null;
      }
    }

    return fileStructures;
  }

  async getById(authPayload: AuthPayloadType, id: number, tx?: PrismaTx) {
    const fileStructure = await this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id }, tx);

    if (!fileStructure) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    return fileStructure;
  }

  async downloadById(res: Response, authPayload: AuthPayloadType, id: number) {
    const fs = await this.getById(authPayload, id);
    const absPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
    const contentTitle = fs.isFile ? fs.title + (fs.fileExstensionRaw ?? '') : fs.title + '.zip';

    res.setHeader('Content-Disposition', `attachment; filename=${contentTitle}`);
    res.writeHead(HttpStatus.OK, {
      ...(fs.mimeTypeRaw && { 'Content-Type': fs.mimeTypeRaw }),
      ...(fs.sizeInBytes && { 'Content-Length': fs.sizeInBytes }),
      'Content-Title': contentTitle,
    });

    if (fs.isFile) {
      const readStream = createReadStream(absPath);
      return readStream.pipe(res);
    } else {
      // user separation folder does not happen in user temp folder zip folder
      const tempDestination = absUserTempFolderZipPath();
      const uniqueName = `${authPayload.user.uuid}-${uuid()}-utc-${moment().toISOString()}`;

      let outputZipPath: string;

      try {
        const { outputZip, err } = await fsCustom.createZipFromFolder({
          sourcePath: absPath,
          destinationPath: tempDestination,
          uniqueName,
        });

        if (err) {
          fsCustom.delete(outputZip);
          return res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Sorry, something went wrong. Please try again.' });
        }

        outputZipPath = outputZip;
      } catch (error) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Sorry, something went wrong. Please try again.' });
      }

      if (outputZipPath) {
        const readStream = createReadStream(outputZipPath);

        readStream.on('close', () => {
          fsCustom.delete(outputZipPath);
        });

        return readStream.pipe(res);
      } else {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Sorry, something went wrong. Please try again.' });
      }
    }
  }

  async uploadFile(dto: UploadFileStructureDto, authPayload: AuthPayloadType, tx?: PrismaTx) {
    const { file, parentId, rootParentId, keepBoth, lastModifiedAt } = dto;

    const { parent } = await this.validateParentRootParentStructure(
      {
        parentId,
        rootParentId,
      },
      tx,
    );

    const userId = authPayload.user.id;
    const isRoot = !parentId && !rootParentId;

    await this.checkStorageLimit(userId, file.size, tx);

    // /something.jpeg -> something or something (1).jpg -> something (1)
    const parsedFile = path.parse(file.originalname);
    const rawExt = mime.extension(file.mimetype);

    if (!rawExt) {
      this.logger.debug(`File has no extension ${rawExt}`);
      throw new BadRequestException('Sorry, something went wrong. Please try again.');
    }

    const ext = `.${rawExt}`;

    const title = !keepBoth
      ? parsedFile.name
      : await this.increaseFileNameNumber({ isFile: true, title: parsedFile.name, userId, parent }, tx);

    const fileNameWithExt = title + ext;

    let entityPath: string;
    let entityDepth: number;

    const userRootContentPath = absUserContentPath(authPayload.user.uuid);

    // Perform fs operation
    if (isRoot) {
      // for fileStructure entity
      entityPath = path.join('/', fileNameWithExt);
      entityDepth = 0;

      if (!keepBoth) {
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: true }, tx);
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

      await fsCustom.writeFile(absolutePath, file.buffer).catch(err => {
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
        await this.replaceFileStructure({ path: entityPath, userId, userRootContentPath, isFile: true }, tx);
      }

      //! Must be after assigning entityPath
      const absolutePath = path.join(userRootContentPath, entityPath);

      this.logger.debug(`Is not root: ${absolutePath}`);

      const exists = await fsCustom.checkDirOrCreate(absolutePath, { isFile: true });

      if (!exists) {
        this.logger.debug('Error happend in parent file folder check');
        throw new InternalServerErrorException('Something went wrong');
      }

      await fsCustom.writeFile(absolutePath, file.buffer).catch(err => {
        this.logger.debug('Error happend in parent file creation');
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      });
    }

    return this.fsRepository.create(
      {
        title,
        color: null,
        userId: authPayload.user.id,
        sizeInBytes: file.size,
        fileExstensionRaw: ext,
        mimeTypeRaw: file.mimetype,
        mimeType: fileStructureHelper.fileTypeRawMimeToEnum[file.mimetype] ?? FileMimeType.OTHER,
        uuid: uuid(),
        isFile: true,
        isShortcut: false,
        isInBin: false,
        isEncrypted: false,
        isEditable: true,
        isLocked: false,
        lastModifiedAt: lastModifiedAt ?? null,

        //! important
        rootParentId: rootParentId ?? null,
        parentId: parentId ?? null,
        path: entityPath, // path from /user-content/{user uuid}/{ -> This is path (full path after uuid) <- }
        depth: entityDepth, // if root 0 or parent depth + 1
      },
      tx,
    );
  }

  async uploadEncryptedFile(dto: UploadEncryptedFileStructureDto, authPayload: AuthPayloadType, tx?: PrismaTx) {
    const { encryptedFile, fileStructureId } = dto;
    const fs = await this.getById(authPayload, fileStructureId, tx);

    if (!fs.isFile) {
      throw new BadRequestException(ExceptionMessageCode.FILE_STRUCTURE_IS_NOT_FILE);
    }

    if (fs.isEncrypted) {
      throw new BadRequestException(ExceptionMessageCode.FILE_STRUCTURE_IS_ALREADY_ENCRYPTED);
    }

    //1. check storage limit, encrypted file may be bigger
    const extraSize = encryptedFile.size - (fs?.sizeInBytes ?? 0);
    await this.checkStorageLimit(authPayload.user.id, extraSize, tx);

    //2. check if extension for given new file is .enc
    //! Here we need to get by parse
    const ext = path.parse(encryptedFile.originalname).ext;

    if (ext.trim() !== constants.ENCRYPTED_EXTENSION) {
      this.logger.debug(`Invalid file extension ${ext}`);
      throw new BadRequestException(ExceptionMessageCode.ONLY_ENCRYPTED_FILES_ALLOWED, {
        description: 'Invalid file extension',
      });
    }

    //3. generate new fs path with new extension
    const existingParsedFile = path.parse(fs.path);
    existingParsedFile.ext = constants.ENCRYPTED_EXTENSION;
    existingParsedFile.base = existingParsedFile.name + constants.ENCRYPTED_EXTENSION;
    const newPath = path.format(existingParsedFile); // same fs path but extension is now .enc

    //4. check if new encrypted filename with same name exists before creation in actual fs
    const sameNameFileStructure = await this.fsRepository.getBy(
      {
        isFile: true,
        userId: authPayload.user.id,
        path: newPath,
      },
      tx,
    );

    if (sameNameFileStructure) {
      throw new BadRequestException(ExceptionMessageCode.FILE_STRUCTURE_ALREADY_EXISTS);
    }

    const newAbsFilePath = path.join(absUserContentPath(authPayload.user.uuid), newPath);

    //5. check if folder exists before creation
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(newAbsFilePath, {
      isFile: true,
      createIfNotExists: false,
    });

    if (!folderCreationSuccess) {
      this.logger.debug(`Folder check error ${newAbsFilePath}`);
      throw new InternalServerErrorException('Something went wrong');
    }

    const existingAbsFilePath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);

    //6. remove existing file before create happens for naming clash
    fsCustom.delete(existingAbsFilePath).catch(err => {
      this.logger.debug(`Error happend in file delete ${existingAbsFilePath}`);
      this.logger.error(err);

      throw new InternalServerErrorException('Something went wrong');
    });

    //7. update isEncrypted
    //8. create new fs encryption column
    //9. create new file with .enc extension
    const [newFs] = await Promise.all([
      this.fsRepository.updateById(
        fileStructureId,
        {
          isEncrypted: true,
          mimeType: FileMimeType.APPLICATION_OCTET_STREAM,
          mimeTypeRaw: fileStructureHelper.fileTypeEnumToRawMime[FileMimeType.APPLICATION_OCTET_STREAM],
          fileExstensionRaw: constants.ENCRYPTED_EXTENSION,
          lastModifiedAt: moment().toDate(),
          path: newPath,
          sizeInBytes: encryptedFile.size,
        },
        {
          userId: authPayload.user.id,
          isInBin: false,
        },
        tx,
      ),
      this.fsEncryptionService.create(
        {
          fileStructureId,
          userId: authPayload.user.id,
          algorithm: EncryptionAlgorithm.AES_256_GCM,
          type: EncryptionType.TEXT,
        },
        tx,
      ),
      fsCustom.writeFile(newAbsFilePath, encryptedFile.buffer).catch(err => {
        this.logger.debug(`Error happend in file creation ${newAbsFilePath}`);
        this.logger.error(err);

        throw new InternalServerErrorException('Something went wrong');
      }),
    ]);

    return newFs;
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
    const userRootContentPath = absUserContentPath(authPayload.user.uuid);

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

    const response = await this.fsRepository.updateByIdAndReturn(id, { userId: authPayload.user.id }, dto);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.INTERNAL_ERROR);
    }

    return response;
  }

  async replaceText(id: number, dto: ReplaceTextFileStructure, authPayload: AuthPayloadType): Promise<FileStructure> {
    const { text } = dto;
    const fs = await this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id });

    if (!fs) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    if (!fs.isFile) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_IS_NOT_FILE);
    }

    if (fs.mimeType !== FileMimeType.TEXT_PLAIN) {
      throw new NotFoundException(ExceptionMessageCode.FS_MUST_BE_TEXT_PLAIN);
    }

    const absPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);

    await fsCustom.access(absPath).catch(e => {
      this.logger.debug(e);
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    });

    const [updatedFs] = await Promise.all([
      this.fsRepository.updateByIdAndReturn(
        id,
        { userId: authPayload.user.id, isInBin: false },
        { lastModifiedAt: moment().toDate() },
      ),
      fsCustom.writeFile(absPath, text).catch(e => {
        this.logger.debug(e);
        throw new InternalServerErrorException(ExceptionMessageCode.INTERNAL_ERROR);
      }),
    ]);

    return updatedFs;
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

    const sourceContentPath = path.join(absUserContentPath(authPayload.user.uuid), fs.path);
    const destinationBinPath = path.join(absUserBinPath(authPayload.user.uuid), nameWithExt);

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
    const response = await this.fsBinService.create({
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
        this.fsBinService.getByFsId(id, authPayload.user.id, tx),
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
      await this.fsBinService.deleteById(fsBin.id, authPayload.user.id, tx);

      const updatedFs = await this.fsRepository.updateByIdAndReturn(
        fs.id,
        {
          userId: authPayload.user.id,
          isInBin: true,
        },
        {
          depth: newParentFs ? newParentFs.depth + 1 : 0,
          isInBin: false,
          path: newPath,
          rootParentId: newParentFs ? newParentFs.rootParentId : null,
          parentId: newParentFs ? newParentFs.id : null,
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
        path.join(absUserBinPath(authPayload.user.uuid), fsBin.path), // source path,
        path.join(absUserContentPath(authPayload.user.uuid), newPath), // source path
      );

      return updatedFs;
    });
  }

  async cleanUpSpace(authPayload: AuthPayloadType, tx: PrismaTx): Promise<void> {
    const [binDelResponse, encDelResponse] = await Promise.all([
      this.fsBinService.deleteMany(authPayload.user.id, tx),
      this.fsEncryptionService.deleteMany(authPayload.user.id, tx),
    ]);

    // delete content last
    const contentDelResponse = await this.fsRepository.deleteMany({ userId: authPayload.user.id }, tx);

    const userRootContentPath = absUserContentPath(authPayload.user.uuid);
    const userRootBinPath = absUserBinPath(authPayload.user.uuid);

    this.logger.debug(`Delete responses userId: ${authPayload.user.id}`);
    this.logger.debug({
      contentDelResponse,
      binDelResponse,
      encDelResponse,
      userRootContentPath,
      userRootBinPath,
    });

    // fnally delete user folders
    await Promise.all([fsCustom.delete(userRootContentPath), fsCustom.delete(userRootBinPath)]);
  }

  async deleteForeverFromBin(id: number, authPayload: AuthPayloadType, tx: PrismaTx): Promise<void> {
    const [fs, fsBin] = await Promise.all([
      this.fsRepository.getByIdForUser(id, { userId: authPayload.user.id, isInBin: true }, tx),
      this.fsBinService.getByFsId(id, authPayload.user.id, tx),
    ]);

    if (!fs) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_NOT_FOUND);
    }

    if (!fs.isInBin) {
      throw new BadRequestException('File is not in bin');
    }

    // delete from fs bin
    await this.fsBinService.deleteById(fsBin.id, authPayload.user.id, tx);

    if (!fs.isFile) {
      // this will delete given fs as well
      const affectedRows = await this.fsRawQueryRepository.recursiveDelete(
        {
          userId: authPayload.user.id,
          id: fs.id,
          inBin: true,
        },
        tx,
      );
      this.logger.debug(`Delete forever folders by fs id of ${fs.id}`);
      this.logger.debug(`Affected rows ${affectedRows.toString()}`);
    } else {
      await this.fsRepository.deleteById(
        fs.id,
        {
          userId: authPayload.user.id,
          isInBin: true,
        },
        tx,
      );
      this.logger.debug(`Delete forever file by fs id of ${fs.id}`);
      this.logger.debug(`Affected rows 0 (was file)`);
    }

    const sourcePath = path.join(absUserBinPath(authPayload.user.uuid), fsBin.path);
    const destinationPath = path.join(absUserDeletedForeverPath(authPayload.user.uuid), fsBin.path);

    // if not exists create user uuid folder as well if not exists
    const folderCreationSuccess = await fsCustom.checkDirOrCreate(destinationPath, {
      isFile: fs.isFile,
      createIfNotExists: true,
    });

    if (!folderCreationSuccess) {
      this.logger.debug('Folder creation error occured');
      throw new InternalServerErrorException('Something went wrong');
    }

    await fsCustom.move(sourcePath, destinationPath);
  }

  private async validateParentRootParentStructure(params: { parentId?: number; rootParentId?: number }, tx?: PrismaTx) {
    const { parentId, rootParentId } = params;

    if ((parentId && !rootParentId) || (!parentId && rootParentId)) {
      throw new NotFoundException('parent id and root parent id must be set at the same time'); // this should not be handled
    }

    let parent: FileStructure | null | undefined;
    let rootParent: FileStructure | null | undefined;

    // if this file has parentId then check if folder exists with this id (refering to parentId)
    if (parentId && rootParentId) {
      [parent, rootParent] = await Promise.all([
        this.fsRepository.getById(parentId, tx),
        this.fsRepository.getById(rootParentId, tx),
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

  private async replaceFileStructure(params: ReplaceFileMethodParams, tx?: PrismaTx): Promise<void> {
    const { path: fileOrFolderPath, userId, userRootContentPath, isFile } = params;

    const sameNameFileStructure = await this.fsRepository.getBy(
      {
        isFile,
        userId,
        path: fileOrFolderPath,
      },
      tx,
    );

    if (sameNameFileStructure) {
      if (isFile) {
        await this.fsRepository.deleteById(sameNameFileStructure.id, { userId }, tx);
      } else {
        await this.fsRawQueryRepository.recursiveDelete(
          {
            id: sameNameFileStructure.id,
            userId,
            inBin: false,
          },
          tx,
        );
      }

      const absolutePath = path.join(userRootContentPath, sameNameFileStructure.path);
      const exists = await fsCustom.checkDirOrCreate(absolutePath, { isFile }); // no need for creation of folder

      if (!exists) {
        this.logger.debug('File should exists in file system');
        throw new InternalServerErrorException('Something went wrong');
      }

      await fsCustom.delete(absolutePath);
    }
  }

  private async increaseFileNameNumber(params: IncreaseFileNameNumberMethodParams, tx?: PrismaTx): Promise<string> {
    const { title, userId, parent, isFile } = params;

    const sameNameFileStructure = await this.fsRepository.getBy(
      {
        parentId: parent?.id,
        isFile,
        userId,
        //
        title, // we need exact match first
      },
      tx,
    );

    if (!sameNameFileStructure) {
      return title;
    }

    // extract starting point before enumeration if there is one
    const titleStartsWith = fileStructureNameDuplicateRegex.test(title)
      ? title.split(' ').slice(0, -1).join(' ')
      : title;

    const sameNameFileStructures = await this.fsRepository.getManyBy(
      {
        parentId: parent?.id,
        isFile,
        userId,
        //
        titleStartsWith,
      },
      tx,
    );

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

  private async checkStorageLimit(userId: number, extraSizeInBytes: number, tx?: PrismaTx): Promise<void> {
    const totalFileSizeBeforeModify = await this.fsRepository.getTotalFilesSize(userId, {}, tx);

    if (totalFileSizeBeforeModify + extraSizeInBytes > constants.MAX_STORAGE_PER_USER_IN_BYTES) {
      throw new ForbiddenException('Storage limit exceeds limit');
    }
  }
}
