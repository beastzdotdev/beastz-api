import { Module } from '@nestjs/common';
import { FileStructureEncryptionService } from './file-structure-encryption.service';
import { FileStructureEncryptionRepository } from './file-structure-encryption.repository';

@Module({
  providers: [FileStructureEncryptionService, FileStructureEncryptionRepository],
  exports: [FileStructureEncryptionService],
})
export class FileStructureEncryptionModule {}
