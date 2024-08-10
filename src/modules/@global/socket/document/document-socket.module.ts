import { Global, Module } from '@nestjs/common';
import { DocumentSocketGateway } from './document-socket.gateway';
import { DocumentSocketMiddleware } from './document-socket.middleware';

@Global()
@Module({
  providers: [DocumentSocketGateway, DocumentSocketMiddleware],
})
export class DocumentSocketModule {}
