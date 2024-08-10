import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';

type SocketErrorData = {
  description?: string;
  [key: string]: unknown;
};

export class SocketError extends Error {
  public readonly data: SocketErrorData;

  constructor(message: ExceptionMessageCode | string, data: SocketErrorData = {}) {
    super(message);
    this.name = SocketError.name;
    this.data = data;
  }
}
