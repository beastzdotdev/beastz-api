import { Socket } from 'socket.io';
import { AccessTokenPayload } from '../../jwt/jwt.type';

export type PushDocBody = {
  userId: string;
  changes: unknown;
};

export type SocketForUserInject = Socket & {
  handshake: Socket['handshake'] & { accessTokenPayload: AccessTokenPayload };
};

export type CollaborationSession = {
  //TODO resume here
  //TODO and after this I think it would be better if I finish db and api stuff first
  //TODO then move to redis because join token is needed from frontend
};
