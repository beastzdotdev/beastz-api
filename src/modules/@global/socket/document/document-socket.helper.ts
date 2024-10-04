import { DocumentSocket } from './document-socket.type';

export function assertDocumentSocketForUser(socket: DocumentSocket): asserts socket is DocumentSocket<'user'> {
  if (!('isServant' in socket.handshake)) {
    throw new Error('isServant param missing in socket handshake');
  }

  if (socket.handshake.isServant) {
    throw new Error('Not a document user');
  }
}

export function assertDocumentSocketForServant(socket: DocumentSocket): asserts socket is DocumentSocket<'servant'> {
  if (!('isServant' in socket.handshake)) {
    throw new Error('isServant param missing in socket handshake');
  }

  if (!socket.handshake.isServant) {
    throw new Error('Not a document servant');
  }
}
