import { Module } from '@nestjs/common';
import { DocumentSocketGateway } from './document-socket.gateway';
import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';
import { DocumentSocketService } from './document-socket.service';
import { FileStructurePublicShareModule } from '../../../file-structure-public-share/file-structure-public-share.module';
import { UserModule } from '../../../user/user.module';
import { FileStructureModule } from '../../../file-structure/file-structure.module';

@Module({
  imports: [FileStructurePublicShareModule, FileStructureModule, UserModule],
  providers: [DocumentSocketGateway, DocumentSocketInitMiddleware, DocumentSocketService],
})
export class DocumentSocketConfigModule {}
