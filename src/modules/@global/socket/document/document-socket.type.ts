import { Socket } from 'socket.io';
import { FileStructurePublicShare } from '@prisma/client';
import { AccessTokenPayload } from '../../jwt/jwt.type';

export type PushDocBody = {
  sharedUniqueHash: string;
  changes: unknown;
  cursorCharacterPos: number;
};

type DocumentSocketForUser = Socket & {
  handshake: Socket['handshake'] & {
    isServant: false;
    accessTokenPayload: AccessTokenPayload;
    user: { uuid: string };
    auth: Socket['handshake']['auth'] & { filesStructureId: number };
  };
};

type DocumentSocketForServant = Socket & {
  handshake: Socket['handshake'] & {
    isServant: true;
    auth: Socket['handshake']['auth'] & { sharedUniqueHash?: string; filesStructureId?: string };
    data: {
      user: {
        id: number;
        uuid: string;
      };
      sharedUniqueHash: string;
      filesStructureId: number;
      fsPublicShare: FileStructurePublicShare;
    };
  };
};

export type DocumentSocket<T = 'user' | 'servant'> = T extends 'user'
  ? DocumentSocketForUser
  : T extends 'servant'
    ? DocumentSocketForServant
    : DocumentSocketForUser | DocumentSocketForServant;
