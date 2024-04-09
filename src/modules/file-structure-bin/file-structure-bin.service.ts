import { Injectable } from '@nestjs/common';
import { FileStructureBin } from '@prisma/client';
import { CreateFileStructureBinParams } from './file-structure-bin.type';
import { FileStructureBinRepository } from './file-structure-bin.repository';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { AuthPayloadType } from '../../model/auth.types';
import { Pagination } from '../../model/types';
import { GetFromBinQueryDto } from './dto/get-from-bin-query.dto';

@Injectable()
export class FileStructureBinService {
  constructor(private readonly fileStructureBinRepository: FileStructureBinRepository) {}

  async getAll(authPayload: AuthPayloadType, queryParams: GetFromBinQueryDto): Promise<Pagination<FileStructureBin>> {
    return this.fileStructureBinRepository.getAll(authPayload, queryParams);
  }

  async create(params: CreateFileStructureBinParams): Promise<FileStructureBin> {
    const fileStructureBin = await this.fileStructureBinRepository.create(params);

    if (!fileStructureBin) {
      throw new Error(ExceptionMessageCode.FILE_STRUCTURE_BIN_CREATION_FAILED);
    }

    return fileStructureBin;
  }
}
