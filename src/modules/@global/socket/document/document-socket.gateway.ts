import { Redis } from 'ioredis';
import { performance } from 'node:perf_hooks';
import { Namespace } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { ChangeSet, Text } from '@codemirror/state';
import { InjectRedis } from '@nestjs-modules/ioredis';
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
import { PushDocBody, DocumentSocket } from './document-socket.type';
import { DocumentSocketService } from './document-socket.service';
import { SocketTokenPayload } from './document-socket-user.decorator';
import { AccessTokenPayload } from '../../jwt/jwt.type';
import { constants } from '../../../../common/constants';
import { EmitterEventFields, EmitterEvents } from '../../event-emitter';
import { SocketError } from '../../../../exceptions/socket.exception';
import { assertDocumentSocketForUser } from './document-socket.helper';
import { CollabRedis } from '../../redis';

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
    private readonly collabRedis: CollabRedis,
  ) {}

  afterInit() {
    //! Very important this code does only work in afterInit not in constructor
    this.documentSocketService.wss = this.wss;

    const totalTimeInMs = (performance.now() - this.time).toFixed(3) + 'ms';
    this.logger.verbose(`socket under namespace of "${constants.socket.DOC_NAMESPACE}" initialized (${totalTimeInMs})`);

    // Register middleware for init (reason: guard executes after connection init which is bad)
    // Validate file structure id in auth as well
    this.wss.use(this.documentSocketInitMiddleware.AuthWsMiddleware());
  }

  async handleConnection(@ConnectedSocket() socket: DocumentSocket): Promise<void> {
    console.log('[Connect] Start - ' + socket.id);
    console.log('isServant - ' + !!socket.handshake.isServant);

    const keyName = socket.handshake.isServant
      ? constants.redis.buildServantsName(socket.id)
      : constants.redis.buildUserIdName(socket.handshake.accessTokenPayload.userId);

    const keyValue = socket.handshake.isServant
      ? socket.handshake.data.sharedUniqueHash
      : socket.handshake.accessTokenPayload.userId;

    await this.redis.set(keyName, keyValue, 'EX', constants.redis.twoDayInSec);

    try {
      await Promise.all([
        this.documentSocketService.setLock(socket),

        socket.handshake.isServant
          ? this.documentSocketService.checkSharingForServant(socket as DocumentSocket<'servant'>)
          : this.documentSocketService.checkSharing(socket as DocumentSocket<'user'>),
      ]);

      // notify myself to fetch document always !
      this.wss.to(socket.id).emit(constants.socket.events.PullDocFull);
    } catch (error) {
      // throwing errors from this method does not seem to be good idea
      // if sometihng bad happens just disconnect client

      this.logger.error(error);
      this.logger.error('[Connect] Early disconnect - ' + socket.id);

      socket.disconnect();
      return;
    }

    console.log('[Connect] finish - ' + socket.id);
  }

  async handleDisconnect(@ConnectedSocket() socket: DocumentSocket) {
    console.log('[Disconnet] Start - ' + socket.id);

    const delKeyName = socket.handshake.isServant
      ? constants.redis.buildServantsName(socket.id)
      : constants.redis.buildUserIdName(socket.handshake.accessTokenPayload.userId);

    await this.redis.del(delKeyName);

    try {
      const { fsCollabKeyName, activeServants, fsId } = await this.documentSocketService.getDisconnectParams(socket);

      let totalPeopleLeftExceptCaller: string[];

      if (socket.handshake.isServant) {
        const masterSocketId = await this.collabRedis.getMasterSocketId(fsCollabKeyName);
        const servantExceptCurrent = activeServants.filter(id => id !== socket.id);

        totalPeopleLeftExceptCaller = [masterSocketId, ...servantExceptCurrent].filter(Boolean);
      } else {
        totalPeopleLeftExceptCaller = activeServants;
      }

      if (!totalPeopleLeftExceptCaller.length) {
        await this.documentSocketService.removeLock(socket);

        const uuid = socket.handshake.isServant ? socket.handshake.data.user.uuid : socket.handshake.user.uuid;
        const userId = socket.handshake.isServant
          ? socket.handshake.data.user.id
          : socket.handshake.accessTokenPayload.userId;

        //! must be after removing lock
        await this.documentSocketService.saveFileStructure({ fsId, fsCollabKeyName, userId, uuid });

        //! must be after saving fs
        await this.redis.del(fsCollabKeyName);
      } else {
        // if there is people left remove servant or master
        if (socket.handshake.isServant) {
          await this.documentSocketService.removeServant(
            fsCollabKeyName,
            socket as DocumentSocket<'servant'>,
            activeServants,
          );
        } else {
          await this.collabRedis.removeMasterSocketId(fsCollabKeyName);
        }
      }

      // notify everyone
      for (const socketId of totalPeopleLeftExceptCaller) {
        if (socketId !== socket.id) {
          this.wss.to(socketId).emit(constants.socket.events.UserLeft, { socketId: socket.id });
        }
      }
    } catch (error) {
      this.logger.error(error);
      this.logger.error('[Disconnet] Early return - ' + socket.id);

      // if forcefully disconnected from handleconnection then forcefull disconnect is not needed here
      socket.connected ? socket.disconnect() : undefined;
      return;
    }

    console.log('[Disconnet] Finish - ' + socket.id);
  }

  @SubscribeMessage(constants.socket.events.PushDoc)
  async handlePushUpdates(@ConnectedSocket() socket: DocumentSocket, @MessageBody() body: PushDocBody) {
    // const now = performance.now();
    let isError = false;

    const { changes, sharedUniqueHash, cursorCharacterPos } = body;

    const fsCollabKeyName = constants.redis.buildFSCollabName(sharedUniqueHash);

    if (!(await this.redis.exists(fsCollabKeyName))) {
      return; // just ignore this scenario will happen if user disables collaboration while socket is active
    }

    try {
      const doc = await this.redis.hget(fsCollabKeyName, 'doc');

      if (doc !== null) {
        const newDoc = ChangeSet.fromJSON(changes)
          .apply(Text.of(doc.split('\n')))
          .toString();

        await this.redis.hset(fsCollabKeyName, 'doc', newDoc);
      } else {
        const [{ servants }, masterSocketId] = await Promise.all([
          this.documentSocketService.getServantsBySharedUniqueHash(sharedUniqueHash),
          this.collabRedis.getMasterSocketId(fsCollabKeyName),
        ]);

        const receivers = new Set([...servants, masterSocketId].filter(Boolean));

        // notify everyone
        for (const socketId of receivers) {
          this.wss.to(socketId).emit(constants.socket.events.RetryConnection);
        }

        // early return
        return;
      }
    } catch (error) {
      isError = true;
      this.logger.error(error);
    }

    if (!isError) {
      const { servants } = await this.documentSocketService.getServantsBySharedUniqueHash(sharedUniqueHash);

      const final = servants;

      // fill master socket id as well
      if (socket.handshake.isServant) {
        const masterSocketId = await this.collabRedis.getMasterSocketId(fsCollabKeyName);

        if (masterSocketId) {
          final.push(masterSocketId);
        }
      }

      // notify all servant
      for (const socketId of servants) {
        if (socketId !== socket.id) {
          this.wss
            .to(socketId)
            .emit(constants.socket.events.PullDoc, { changes, cursorCharacterPos, socketId: socket.id });
        }
      }
    } else {
      // if error happens
      this.wss.to(socket.id).emit(constants.socket.events.PullDocFull);
    }

    // const totalTimeInMs = (performance.now() - now).toFixed(3) + 'ms';
    // this.logger.verbose(`[PushDoc] ${totalTimeInMs}`);
  }

  @SubscribeMessage(constants.socket.events.PullDocFull)
  async handlePullUpdates(@ConnectedSocket() socket: DocumentSocket) {
    this.wss.to(socket.id).emit(constants.socket.events.PullDocFull);
  }

  //================================================================
  // Via Event Emitter
  //================================================================

  @OnEvent(EmitterEventFields['document.pull.doc.full'], { async: true })
  async documentPullDocFull(payload: EmitterEvents['document.pull.doc.full']) {
    console.log('='.repeat(20));
    console.log('changes');
    console.log(payload);

    const { userId } = payload;
    const socketId = await this.redis.get(constants.redis.buildUserIdName(userId));

    if (!socketId) {
      this.logger.error(`User ${userId} not found in redis`);
      return;
    }

    this.wss.to(socketId).emit(constants.socket.events.PullDocFull);
  }

  @OnEvent(EmitterEventFields['document.share.disabled'], { async: true })
  async documentPullDoc(payload: EmitterEvents['document.share.disabled']) {
    const { activeServants } = payload;

    // this event only happend from master connection
    for (const socketId of activeServants) {
      this.wss.to(socketId).emit(constants.socket.events.RetryConnection);
    }
  }

  //================================================================
  // Tests
  //================================================================

  @SubscribeMessage('test')
  async handleUpdatex(@ConnectedSocket() socket: DocumentSocket, @SocketTokenPayload() payload: AccessTokenPayload) {
    if (socket.handshake.isServant) {
      assertDocumentSocketForUser(socket);

      this.logger.debug('='.repeat(20));
      this.logger.debug('test from servant');
      this.logger.debug('socket id', socket.id);
      this.logger.debug('socket handshake', socket.handshake);
      this.logger.debug('payload', payload);

      socket.emit('test', 'trigerring from backend');
      this.logger.debug('Emitted from server to test event');
      this.logger.debug('='.repeat(20));

      socket.emit(
        'error',
        new SocketError('Something went wrong', {
          description: `Caught general error (UNINTENDED ERROR)`,
        }),
      );
      return;
    }

    assertDocumentSocketForUser(socket);

    this.logger.debug('='.repeat(20));
    this.logger.debug('test from user');
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

  @OnEvent(EmitterEventFields['admin.socket.test'], { async: true })
  async testSocketFromAdmin(payload: EmitterEvents['admin.socket.test']) {
    // emit to all connected clients in this namespace
    if (payload.type === 'namespace') {
      this.wss.emit('admin_test', payload.message);
    }
  }
}
