import { Module } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { FileStructureController } from './file-structure.controller';
import { FileStructureRepository } from './file-structure.repository';
import { FileStructureBinModule } from '../file-structure-bin/file-structure-bin.module';

@Module({
  imports: [FileStructureBinModule],
  controllers: [FileStructureController],
  providers: [FileStructureService, FileStructureRepository],
})
export class FileStructureModule {}
