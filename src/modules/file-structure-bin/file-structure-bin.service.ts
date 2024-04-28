import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FileStructureBin } from '@prisma/client';
import { CreateFileStructureBinParams, FileStructureBinWithRelation } from './file-structure-bin.type';
import { FileStructureBinRepository } from './file-structure-bin.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { AuthPayloadType } from '../../model/auth.types';
import { Pagination } from '../../model/types';
import { GetFromBinQueryDto } from './dto/get-from-bin-query.dto';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class FileStructureBinService {
  constructor(private readonly fileStructureBinRepository: FileStructureBinRepository) {}

  async getById(id: number, userId: number, tx: PrismaTx): Promise<FileStructureBin> {
    const response = await this.fileStructureBinRepository.getById(id, userId, tx);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_BIN_NOT_FOUND);
    }

    return response;
  }

  async getByFsId(fileStructureId: number, userId: number, tx: PrismaTx): Promise<FileStructureBin> {
    const response = await this.fileStructureBinRepository.getByFsId(fileStructureId, userId, tx);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.FILE_STRUCTURE_BIN_NOT_FOUND);
    }

    return response;
  }

  async getAll(
    authPayload: AuthPayloadType,
    queryParams: GetFromBinQueryDto,
  ): Promise<Pagination<FileStructureBinWithRelation>> {
    return this.fileStructureBinRepository.getAll(authPayload, queryParams);
  }

  async create(params: CreateFileStructureBinParams): Promise<FileStructureBin> {
    const fileStructureBin = await this.fileStructureBinRepository.create(params);

    if (!fileStructureBin) {
      throw new BadRequestException(ExceptionMessageCode.FILE_STRUCTURE_BIN_CREATION_FAILED);
    }

    return fileStructureBin;
  }

  async deleteById(id: number, userId: number, tx: PrismaTx): Promise<FileStructureBin> {
    return this.fileStructureBinRepository.deleteById(id, userId, tx);
  }
}
