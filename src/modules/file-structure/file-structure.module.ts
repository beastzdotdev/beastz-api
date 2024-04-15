import { Module } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { FileStructureController } from './file-structure.controller';
import { FileStructureRepository } from './file-structure.repository';
import { FileStructureBinModule } from '../file-structure-bin/file-structure-bin.module';
import { FileStructureRawQueryRepository } from './file-structure-raw-query.repositor';

@Module({
  imports: [FileStructureBinModule],
  controllers: [FileStructureController],
  providers: [FileStructureService, FileStructureRepository, FileStructureRawQueryRepository],
})
export class FileStructureModule {}
