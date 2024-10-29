```ts
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

  public async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('Disconnected ' + client.id);

    // console.time('retrieved');
    // const retrieved = await this.redis.get(client.id);
    // console.timeEnd('retrieved');

    // console.log('removing', retrieved);

    // console.log('unseen', await this.redis.keys('12'));

    // this.redis.del(client.id);
  }

  @SubscribeMessage('getDocument')
  async getDocument(@ConnectedSocket() socket: Socket) {
    socket.emit('getDocumentResponse', this.updates.length, this.doc.toString());
  }

  @SubscribeMessage('pushUpdates')
  async handlePushUpdates(@ConnectedSocket() socket: Socket, @MessageBody() body: PushUpdateBody) {
    // console.log([...new Set(this.updates.map(e => e.clientID))]);
    // console.log('pushUpdates' + '---' + socket.id + '---' + ` (${Math.random().toFixed(3).toString()})`);

    const { version, updates: docUpdates } = body;

    try {
      if (version != this.updates.length) {
        console.log('denied');

        socket.emit('pushUpdateResponse', false);
      } else {
        console.log('not denied');
        console.log(docUpdates);

        for (const update of docUpdates) {
          // Convert the JSON representation to an actual ChangeSet instance
          const changes = ChangeSet.fromJSON(update.changes);

          console.log('='.repeat(20));
          console.log(update);
          console.log(update.changes);
          console.log(changes);

          this.updates.push(update);
          this.doc = changes.apply(this.doc);
        }

        socket.emit('pushUpdateResponse', true);

        console.log('pending');
        console.log(this.pending);

        while (this.pending.length) this.pending.pop()?.(this.updates);
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage('pullUpdates')
  async handleUpdate(@ConnectedSocket() socket: Socket, @MessageBody() version: number) {
    if (version < this.updates.length) {
      console.log('from ' + version + ' to ' + this.updates.length + '----' + 1);

      socket.emit('pullUpdateResponse', this.updates.slice(version));
    } else {
      console.log('from ' + version + ' to ' + this.updates.length + '----' + 2);
      console.log(this.pending);

      this.pending.push(updates => {
        socket.emit('pullUpdateResponse', updates.slice(version));
      });
    }
  }

  @SubscribeMessage('test')
  async handleUpdatex(@ConnectedSocket() socket: Socket) {
    console.log('test');
    socket.emit('test', 142);
  }
}
```