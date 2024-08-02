import { Injectable, Logger } from '@nestjs/common';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';

@Injectable()
export class FileStructurePublicShareService {
  private readonly logger = new Logger(FileStructurePublicShareService.name);

  constructor(private readonly fsPublicShareRepository: FileStructurePublicShareRepository) {}
}
