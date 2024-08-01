import { Global, Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Global()
@Module({
  providers: [SocketGateway],
})
export class SocketModule {}
