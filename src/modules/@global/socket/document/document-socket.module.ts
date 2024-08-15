import { Global, Module } from '@nestjs/common';
import { DocumentSocketGateway } from './document-socket.gateway';
import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';

@Global()
@Module({
  providers: [DocumentSocketGateway, DocumentSocketInitMiddleware],
})
export class DocumentSocketModule {}
