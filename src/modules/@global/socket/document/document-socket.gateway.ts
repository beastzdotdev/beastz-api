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

import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { OnEvent } from '@nestjs/event-emitter';
import { DocumentSocketInitMiddleware } from './document-socket-init.middleware';
import { PushDocBody, SocketForUserInject } from './document-socket.type';
import { DocumentSocketTokenExtractGuard } from './document-socket-token-extract.guard';
import { DocumentSocketService } from './document-socket.service';
import { SocketTokenPayload } from './document-socket-user.decorator';
import { AccessTokenPayload } from '../../jwt/jwt.type';
import { constants } from '../../../../common/constants';
import { EmitterEventFields, EmitterEvents } from '../../event-emitter';
import { FileStructurePublicShareService } from '../../../file-structure-public-share/file-structure-public-share.service';
import { SocketError } from '../../../../exceptions/socket.exception';

/**
 * @description Namespace for Document, Extra configurations are in adapter
 *
 * Document because it is simultaneously a document saver and a collaboration
 *
 * this.wss <- basically namespace instance of socket
 * this.wss.server <- this is root socket instance
 *
 * this.wss.use <- works only on this namespace
 * this.wss.server.use <- works on all socket instance
 */
@WebSocketGateway({ namespace: constants.socket.DOC_NAMESPACE })
export class DocumentSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly time = performance.now();
  private readonly logger = new Logger(DocumentSocketGateway.name);

  doc: Text = Text.of(['Start document']);

  @WebSocketServer() private wss: Namespace;

  constructor(
    @InjectRedis()
    private readonly redis: Redis,

    private readonly documentSocketInitMiddleware: DocumentSocketInitMiddleware,
    private readonly documentSocketService: DocumentSocketService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {
    this.documentSocketService.wss = this.wss;
  }

  afterInit() {
    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket under namespace of "${constants.socket.DOC_NAMESPACE}" initialized (${totalTimeInMs})`);

    // Register middleware for init (reason: guard executes after connection init which is bad)
    // Validate file structure id in auth as well
    this.wss.use(this.documentSocketInitMiddleware.AuthWsMiddleware());
  }

  /**
   * On this method name decorators and guards and interceptors does not work this is just callback
   * so I have to manually extract some data like access token payload, also throwing errors from this
   * method does not seem to be good idea, if sometihng bad happens just disconnect client
   */
  async handleConnection(@ConnectedSocket() clientSocket: SocketForUserInject): Promise<void> {
    console.log('[Connect] Start - ' + clientSocket.id);

    //TODO now after lots of things are stable
    //TODO   (+) start adding collab button back first
    //TODO    * fix activating collab extension in front
    //TODO    * after that start adding back push doc
    //TODO    * after that start adding back pull doc

    //TODO: check multiple processes
    //TODO      * when user connects and share is enabled
    //TODO      * when user connects and share is disabled
    //TODO      * when user reconnects and share is enabled
    //TODO      * when user reconnects and share is disabled

    //TODO      * when user enables collab and start typing
    //TODO      * when user disables collab and start typing

    //TODO after adding others then test this
    //TODO      * fix people component in front and start
    //TODO      * when others rejoin
    //TODO      * when other reconnect

    //TODO      * when user disconnects and others are still active
    //TODO      * when user disables collab and others are still active

    //TODO      * add cursor at the very end
    //TODO      * collab people missing people :D

    try {
      const isFsPublicShareEnabled = await this.fsPublicShareService.isEnabled(
        { user: { id: clientSocket.handshake.accessTokenPayload.userId } },
        clientSocket.handshake.auth.filesStructureId,
      );

      await Promise.all([
        this.documentSocketService.setLock(clientSocket),
        this.documentSocketService.checkSharing(clientSocket, isFsPublicShareEnabled),
      ]);

      if (isFsPublicShareEnabled) {
        // notify myself to fetch document
        this.wss.to(clientSocket.id).emit(constants.socket.events.PullDocFull);
      }
    } catch (error) {
      this.logger.error(error);
      this.logger.error('[Connect] Early disconnect - ' + clientSocket.id);

      clientSocket.disconnect();
      return;
    }

    await this.redis.set(
      `userId-[${clientSocket.handshake.accessTokenPayload.userId}]-socketId-[${clientSocket.id}]`,
      1,
      'EX',
      constants.redis.twoDayInSec,
    ); // just for information

    console.log('[Connect] finish - ' + clientSocket.id);
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: SocketForUserInject) {
    console.log('[Disconnet] Start - ' + clientSocket.id);
    try {
      const { fsCollabKeyName, activeServants, fsId } =
        await this.documentSocketService.getDisconnectParams(clientSocket);

      if (!activeServants.length) {
        await this.documentSocketService.removeLock(clientSocket);

        //! must be after removing lock
        await this.documentSocketService.saveFileStructure(clientSocket, { fsId, fsCollabKeyName });

        //! must be after saving fs
        await this.redis.del(fsCollabKeyName);
      }

      // notify everyone
      for (const socketId of activeServants) {
        this.wss.to(socketId).emit(constants.socket.events.UserLeft, { socketId: clientSocket.id });
      }
    } catch (error) {
      this.logger.error(error);
      this.logger.error('[Disconnet] Early return - ' + clientSocket.id);

      // if forcefully disconnected from handleconnection then forcefull disconnect is not needed here
      clientSocket.connected ? clientSocket.disconnect() : undefined;
      return;
    } finally {
      // just for information
      await this.redis.del(
        `userId-[${clientSocket.handshake.accessTokenPayload.userId}]-socketId-[${clientSocket.id}]`,
      );
    }

    console.log('[Disconnet] Finish - ' + clientSocket.id);
  }

  @UseGuards(DocumentSocketTokenExtractGuard)
  @SubscribeMessage(constants.socket.events.PushDoc)
  async handlePushUpdates(@ConnectedSocket() socket: Socket, @MessageBody() body: PushDocBody) {
    let isError = false;

    const { changes, sharedUniqueHash } = body;

    try {
      const fsCollabKeyName = constants.redis.buildFSCollabName(sharedUniqueHash);
      const doc = await this.redis.hget(fsCollabKeyName, 'doc');

      if (doc) {
        // this is three liner
        // const docObj = Text.of(doc.split('\n'));
        // const changeSet = ChangeSet.fromJSON(changes);
        // const newDoc = changeSet.apply(docObj);

        const newDoc = ChangeSet.fromJSON(changes)
          .apply(Text.of(doc.split('\n')))
          .toString();

        await this.redis.hset(fsCollabKeyName, 'doc', newDoc);
      }
    } catch (error) {
      isError = true;
      this.logger.error(error);
    }
    if (!isError) {
      // pulled by everyone
      socket.broadcast.emit(constants.socket.events.PullDoc, changes);
    } else {
      // if error happens
      this.wss.to(socket.id).emit(constants.socket.events.PullDocFull);
    }
  }

  @UseGuards(DocumentSocketTokenExtractGuard)
  @SubscribeMessage('test')
  async handleUpdatex(
    @ConnectedSocket() socket: SocketForUserInject,
    @SocketTokenPayload() payload: AccessTokenPayload,
  ) {
    this.logger.debug('='.repeat(20));
    this.logger.debug('test');
    this.logger.debug('socket id', socket.id);
    this.logger.debug('socket handshake', socket.handshake);
    this.logger.debug('checking if payload works', payload.userId === socket.handshake.accessTokenPayload.userId);

    socket.emit('test', 'trigerring from backend');
    this.logger.debug('Emitted from server to test event');
    this.logger.debug('='.repeat(20));

    socket.emit(
      'error',
      new SocketError('Something went wrong', {
        description: `Caught general error (UNINTENDED ERROR)`,
      }),
    );
  }

  //================================================================
  // Via Event Emitter
  //================================================================

  @OnEvent(EmitterEventFields['admin.socket.test'])
  testSocketFromAdmin(payload: EmitterEvents['admin.socket.test']) {
    // emit to all connected clients in this namespace
    if (payload.type === 'namespace') {
      this.wss.emit('admin_test', payload.message);
    }
  }
}
