import { Module } from '@nestjs/common';
import { FileStructurePublicShareController } from './file-structure-public-share.controller';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';

@Module({
  controllers: [FileStructurePublicShareController],
  providers: [FileStructurePublicShareService, FileStructurePublicShareRepository],
  exports: [FileStructurePublicShareService],
})
export class FileStructurePublicShareModule {}
