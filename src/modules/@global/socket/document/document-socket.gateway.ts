import Redis from 'ioredis';
import { performance } from 'node:perf_hooks';
import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Namespace } from 'socket.io';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ChangeSet, Text } from '@codemirror/state';
import {
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';

import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';
import { PushDocBody } from './document-socket.type';
import { DocumentSocketTokenExtractGuard } from './document-socket-token-extract.guard';
import { SocketTokenPayload } from './document-socket-user.decorator';
import { AccessTokenPayload } from '../../jwt/jwt.type';

/**
 * @description Namespace for Document
 *
 * Document because it is simultaneously a document saver and a collaboration
 *
 * this.wss <- basically namespace instance of socket
 * this.wss.server <- this is root socket instance
 *
 * this.wss.use <- works only on this namespace
 * this.wss.server.use <- works on all socket instance
 *
 * ! Extra configurations are in adapter
 */
@WebSocketGateway({ namespace: 'document' })
export class DocumentSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly time = performance.now();
  private readonly logger = new Logger(DocumentSocketGateway.name);

  doc: Text = Text.of(['Start document']);

  @WebSocketServer() public wss: Namespace;

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly documentSocketMiddleware: DocumentSocketInitMiddleware,
  ) {}

  afterInit() {
    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket initialized (${totalTimeInMs})`);

    //! Authentication for socket namespace 'doc'
    this.wss.use(this.documentSocketMiddleware.AuthWsMiddleware());
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('Connected ' + client.id);
    // await this.redis.set(client.id, 'temp');
    //
    // add socket connection to redis
    // console.log(client.recovered);
    // console.log('recovered ' + client.recovered);
    // console.log('Connected ' + client.id);
    // // make do locked
    // console.log(await this.redis.keys('*'));
    // // console.log(this.wss.sockets.keys());
    // console.log([...this.wss.sockets.keys()]);
    // for (const [key, value] of this.wss.sockets.entries()) {
    //   console.log('='.repeat(20));
    //   console.log(key);
    //   console.log(value.conn.remoteAddress + ':' + value.conn.transport.name + ':' + value.conn.protocol);
    //   console.log(value.id + '-' + 'recovered:' + value.recovered);
    //   console.log('='.repeat(20));
    // }
    // console.log(this.wss.sockets);
    // console.log(this.wss.sockets);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Disconnected ' + client.id);

    // console.time('retrieved');
    // const retrieved = await this.redis.get(client.id);
    // console.timeEnd('retrieved');

    // console.log('removing', retrieved);

    // console.log('unseen', await this.redis.keys('12'));

    // this.redis.del(client.id);
  }

  @SubscribeMessage('fetch_doc')
  async getDocument() {
    return this.doc.toString();
  }

  @UseGuards(DocumentSocketTokenExtractGuard)
  @SubscribeMessage('push_doc')
  async handlePushUpdates(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: PushDocBody,
    @SocketTokenPayload() payload: AccessTokenPayload,
  ) {
    console.log(123);
    console.log(payload);

    const { changes, userId } = body;

    // console.log(socket);
    //TODO I think you can somehow sync up changes using this.doc (currently it is not in use)

    let isError = false;

    try {
      const changeSet = ChangeSet.fromJSON(changes);
      this.doc = changeSet.apply(this.doc);
    } catch (error) {
      isError = true;
      this.logger.error(error);
      // console.error(error);
    }

    if (!isError) {
      socket.broadcast.emit('pull_doc', changes);
    }
  }

  @SubscribeMessage('test')
  async handleUpdatex(@ConnectedSocket() socket: Socket) {
    //TODO: in sockets eror not work great, try exception filter for socket io or if not then
    //TODO: socket io response error middleware
    console.log('test');

    socket.emit('test', 142);
    // throw new Error('142');
    // return 12;
  }
}
