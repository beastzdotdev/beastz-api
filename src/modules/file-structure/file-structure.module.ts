import { Module } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { FileStructureController } from './file-structure.controller';

@Module({
  controllers: [FileStructureController],
  providers: [FileStructureService],
})
export class FileStructureModule {}
