import { Injectable, NotFoundException } from '@nestjs/common';
import { FileStructureEncryption } from '@prisma/client';
import { FileStructureEncryptionParams } from './file-structure-encryption.type';
import { FileStructureEncryptionRepository } from './file-structure-encryption.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class FileStructureEncryptionService {
  constructor(private readonly fileStructureEncryptionRepository: FileStructureEncryptionRepository) {}

  async getById(id: number, userId: number, tx?: PrismaTx): Promise<FileStructureEncryption> {
    const response = await this.fileStructureEncryptionRepository.getById(id, userId, tx);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.FS_ENCRYPTION_NOT_FOUND);
    }

    return response;
  }

  async create(params: FileStructureEncryptionParams, tx?: PrismaTx): Promise<FileStructureEncryption> {
    const response = await this.fileStructureEncryptionRepository.create(params, tx);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.FS_ENCRYPTION_CREATE_FAILED);
    }

    return response;
  }

  async deleteById(id: number, userId: number, tx?: PrismaTx): Promise<FileStructureEncryption> {
    return this.fileStructureEncryptionRepository.deleteById(id, userId, tx);
  }
}
