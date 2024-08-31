import { Global, Module } from '@nestjs/common';
import { DocumentSocketGateway } from './document-socket.gateway';
import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';
import { DocumentSocketGatewayHelper } from './document-socket.helper';
import { DocumentSocketService } from './document-socket.service';

@Global()
@Module({
  providers: [DocumentSocketGateway, DocumentSocketInitMiddleware, DocumentSocketGatewayHelper, DocumentSocketService],
  exports: [DocumentSocketGatewayHelper],
})
export class DocumentSocketModule {}
