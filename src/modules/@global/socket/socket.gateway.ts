import type { Update } from '@codemirror/collab';
import { performance } from 'node:perf_hooks';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChangeSet, StateEffect, Text } from '@codemirror/state';
import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

type PushUpdateBody = {
  version: number;
  updates: {
    clientID: string;
    changes: any;
    effects: readonly StateEffect<any>[] | undefined;
  }[];
};

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private time = performance.now();
  private readonly logger = new Logger(SocketGateway.name);

  //TODO: Temp properties
  updates: Update[] = [];
  doc: Text = Text.of(['Start document']);
  pending: ((value: any) => void)[] = [];

  @WebSocketServer() public wss: Server;

  constructor() {}

  afterInit() {
    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket initialized (${totalTimeInMs})`);
  }

  public async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('Connected ' + client.id);
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
}
