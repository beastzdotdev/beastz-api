import { Module } from '@nestjs/common';
import { FileStructurePublicShareController } from './file-structure-public-share.controller';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { FileStructurePublicShareRepository } from './file-structure-public-share.repository';
import { FileStructureModule } from '../file-structure/file-structure.module';
import { FsPublicSharePureService } from './fs-public-share-pure.service';
import { FileStructurePublicShareMapper } from './file-structure-public-share.mapper';

@Module({
  imports: [FileStructureModule],
  controllers: [FileStructurePublicShareController],
  providers: [
    FileStructurePublicShareService,
    FileStructurePublicShareRepository,
    FsPublicSharePureService,
    FileStructurePublicShareMapper,
  ],
  exports: [FileStructurePublicShareService, FsPublicSharePureService],
})
export class FileStructurePublicShareModule {}
