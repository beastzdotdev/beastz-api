import { performance } from 'node:perf_hooks';
import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Namespace } from 'socket.io';
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
import { PushDocBody, SocketForUserInject } from './document-socket.type';
import { DocumentSocketTokenExtractGuard } from './document-socket-token-extract.guard';
import { SocketTokenPayload } from './document-socket-user.decorator';
import { AccessTokenPayload } from '../../jwt/jwt.type';
import { DocumentSocketService } from './document-socket.service';

const DOC_NAMESPACE = 'document';

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
@WebSocketGateway({ namespace: DOC_NAMESPACE })
export class DocumentSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly time = performance.now();
  private readonly logger = new Logger(DocumentSocketGateway.name);

  doc: Text = Text.of(['Start document']);

  @WebSocketServer() public wss: Namespace;

  constructor(
    private readonly documentSocketInitMiddleware: DocumentSocketInitMiddleware,
    private readonly documentSocketService: DocumentSocketService,
  ) {}

  afterInit() {
    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket under namespace of "${DOC_NAMESPACE}" initialized (${totalTimeInMs})`);

    // Register middleware for init (reason: guard executes after connection init which is bad)
    this.wss.use(this.documentSocketInitMiddleware.AuthWsMiddleware());
  }

  /**
   * On this method name decorators and guards and interceptors does not work this is just callback
   * so I have to manually extract some data like access token payload, also throwing errors from this
   * method does not seem to be good idea, if sometihng bad happens just disconnect client
   */
  async handleConnection(@ConnectedSocket() clientSocket: SocketForUserInject) {
    console.log('Connected ' + clientSocket.id);

    await this.documentSocketService.setLock(clientSocket);
  }

  /**
   * Same description as in handelConenction, read above
   */
  async handleDisconnect(@ConnectedSocket() clientSocket: SocketForUserInject) {
    console.log('Disconnected ' + clientSocket.id);

    await this.documentSocketService.removeLock(clientSocket);
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

    const { changes } = body;

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

  @UseGuards(DocumentSocketTokenExtractGuard)
  @SubscribeMessage('test')
  async handleUpdatex(@ConnectedSocket() socket: Socket, @SocketTokenPayload() payload: AccessTokenPayload) {
    //TODO: in sockets eror not work great, try exception filter for socket io or if not then
    //TODO: socket io response error middleware
    console.log('test');

    socket.emit('test', 142);
    console.log('='.repeat(20));
    console.log(payload);
    // throw new Error('142');
    // return 12;
  }
}
