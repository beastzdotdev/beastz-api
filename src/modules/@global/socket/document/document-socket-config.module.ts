import { Global, Module } from '@nestjs/common';
import { DocumentSocketGateway } from './document-socket.gateway';
import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';
import { DocumentSocketService } from './document-socket.service';
import { FileStructurePublicShareModule } from '../../../file-structure-public-share/file-structure-public-share.module';

@Global()
@Module({
  imports: [FileStructurePublicShareModule],
  providers: [DocumentSocketGateway, DocumentSocketInitMiddleware, DocumentSocketService],
})
export class DocumentSocketConfigModule {}
