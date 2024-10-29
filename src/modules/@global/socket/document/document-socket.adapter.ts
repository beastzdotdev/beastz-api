import { performance } from 'node:perf_hooks';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { EnvService } from '../../env/env.service';

export class DocumentSocketAdapter extends IoAdapter {
  private readonly logger = new Logger(DocumentSocketAdapter.name);

  private readonly env: EnvService;

  constructor(app: INestApplication, env: EnvService) {
    super(app);
    this.env = env;
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const time = performance.now();
    if (options) {
      options = {
        ...options,
        allowEIO3: false,
        transports: ['websocket'],
        cors: {
          origin: [this.env.get('FRONTEND_DOCUMENT_URL')],
          credentials: true,
        },
      };
    }

    const server: Server = super.createIOServer(port, options);
    this.logger.verbose(`socket adapter created (${(performance.now() - time).toFixed(3)}ms)`);

    return server;
  }
}
