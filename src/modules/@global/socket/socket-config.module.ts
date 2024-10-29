import { Global, Module } from '@nestjs/common';
import { DocumentSocketConfigModule } from './document';

@Global()
@Module({
  imports: [DocumentSocketConfigModule],
})
export class SocketConfigModule {}
