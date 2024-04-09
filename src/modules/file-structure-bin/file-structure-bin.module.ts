import { Module } from '@nestjs/common';
import { FileStructureBinService } from './file-structure-bin.service';
import { FileStructureBinRepository } from './file-structure-bin.repository';
import { FileStructureBinController } from './file-structure-bin.controller';

@Module({
  controllers: [FileStructureBinController],
  providers: [FileStructureBinService, FileStructureBinRepository],
  exports: [FileStructureBinService],
})
export class FileStructureBinModule {}
