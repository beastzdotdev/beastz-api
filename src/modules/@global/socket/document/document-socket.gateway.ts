import type { Update } from '@codemirror/collab';
import { performance } from 'node:perf_hooks';
import { Logger } from '@nestjs/common';
import { Socket, Namespace } from 'socket.io';
import { ChangeSet, StateEffect, Text } from '@codemirror/state';
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
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { DocumentSocketMiddleware } from './document-socket.middleware';

type PushUpdateBody = {
  version: number;
  updates: {
    clientID: string;
    changes: any;
    effects: readonly StateEffect<any>[] | undefined;
  }[];
};

/**
 * @description
 *
 * this.wss <- basically namespace instance of socket
 * this.wss.server <- this is root socket instance
 *
 * this.wss.use <- works only on this namespace
 * this.wss.server.use <- works on all socket instance
 *
 * ! Extra configurations are in adapter
 */
@WebSocketGateway({
  namespace: 'doc-edit',
  allowEIO3: false,
  transports: ['websocket'],
  cors: { origin: ['http://localhost:3000'], credentials: true },
})
export class DocumentSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly time = performance.now();
  private readonly logger = new Logger(DocumentSocketGateway.name);

  //TODO: Temp properties, move to redis
  updates: Update[] = [];
  doc: Text = Text.of(['Start document']);
  pending: ((value: any) => void)[] = [];

  @WebSocketServer() public wss: Namespace;

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly documentSocketMiddleware: DocumentSocketMiddleware,
  ) {}

  afterInit() {
    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket initialized (${totalTimeInMs})`);

    //! Authentication for socket namespace 'doc'
    this.wss.use(this.documentSocketMiddleware.AuthWsMiddleware());
  }

  public async handleConnection(@ConnectedSocket() client: Socket) {
    // add socket connection to redis

    // console.log(client.recovered);

    console.log('recovered ' + client.recovered);
    console.log('Connected ' + client.id);
    // make do locked

    console.log(await this.redis.keys('*'));
    // console.log(this.wss.sockets.keys());
    console.log([...this.wss.sockets.keys()]);

    for (const [key, value] of this.wss.sockets.entries()) {
      console.log('='.repeat(20));
      console.log(key);
      console.log(value.conn.remoteAddress + ':' + value.conn.transport.name + ':' + value.conn.protocol);
      console.log(value.id + '-' + 'recovered:' + value.recovered);
    }
    // console.log(this.wss.sockets);

    // console.log(this.wss.sockets);
  }

  public async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Disconnected ' + client.id);
  }

  @SubscribeMessage('getDocument')
  async getDocument(@ConnectedSocket() socket: Socket) {
    socket.emit('getDocumentResponse', this.updates.length, this.doc.toString());
  }

  @SubscribeMessage('pushUpdates')
  async handlePushUpdates(@ConnectedSocket() socket: Socket, @MessageBody() body: PushUpdateBody) {
    console.log('pushUpdates' + '---' + socket.id + ` (${Math.random().toFixed(3).toString()})`);

    const { version, updates: docUpdates } = body;

    try {
      if (version != this.updates.length) {
        socket.emit('pushUpdateResponse', false);
      } else {
        for (const update of docUpdates) {
          // Convert the JSON representation to an actual ChangeSet instance
          const changes = ChangeSet.fromJSON(update.changes);
          this.updates.push(update);

          this.doc = changes.apply(this.doc);
        }
        socket.emit('pushUpdateResponse', true);

        while (this.pending.length) this.pending.pop()?.(this.updates);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('pullUpdates')
  async handleUpdate(@ConnectedSocket() socket: Socket, @MessageBody() version: number) {
    if (version < this.updates.length) {
      socket.emit('pullUpdateResponse', JSON.stringify(this.updates.slice(version)));
    } else {
      this.pending.push(updates => {
        socket.emit('pullUpdateResponse', JSON.stringify(updates.slice(version)));
      });
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
