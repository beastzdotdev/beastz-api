import { Module } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { FileStructureController } from './file-structure.controller';
import { FileStructureRepository } from './file-structure.repository';

@Module({
  controllers: [FileStructureController],
  providers: [FileStructureService, FileStructureRepository],
})
export class FileStructureModule {}
