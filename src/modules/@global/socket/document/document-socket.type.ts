import { Socket } from 'socket.io';
import { AccessTokenPayload } from '../../jwt/jwt.type';

export type PushDocBody = {
  sharedUniqueHash: string;
  changes: unknown;
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
    sharedUniqueHash: string;
    auth: Socket['handshake']['auth'] & { sharedUniqueHash?: string };
  };
};

export type DocumentSocket<T = 'user' | 'servant'> = T extends 'user'
  ? DocumentSocketForUser
  : T extends 'servant'
    ? DocumentSocketForServant
    : DocumentSocketForUser | DocumentSocketForServant;
