import { forwardRef, Module } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { FileStructureController } from './file-structure.controller';
import { FileStructureRepository } from './file-structure.repository';
import { FileStructureBinModule } from '../file-structure-bin/file-structure-bin.module';
import { FileStructureRawQueryRepository } from './file-structure-raw-query.repositor';
import { FileStructureEncryptionModule } from '../file-structure-encryption/file-structure-encryption.module';
import { FileStructurePublicShareModule } from '../file-structure-public-share/file-structure-public-share.module';

@Module({
  imports: [FileStructureBinModule, FileStructureEncryptionModule, forwardRef(() => FileStructurePublicShareModule)],
  controllers: [FileStructureController],
  providers: [FileStructureService, FileStructureRepository, FileStructureRawQueryRepository],
  exports: [FileStructureService],
})
export class FileStructureModule {}
