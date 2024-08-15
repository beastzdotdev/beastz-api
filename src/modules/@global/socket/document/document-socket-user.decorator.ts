import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SocketForUserInject } from './document-socket.type';
import { AccessTokenPayload } from '../../jwt/jwt.type';

export const SocketTokenPayload = createParamDecorator<never, ExecutionContext, AccessTokenPayload>(
  (_: never, context: ExecutionContext) => {
    return context.switchToWs().getClient<SocketForUserInject>().handshake.accessTokenPayload;
  },
);
