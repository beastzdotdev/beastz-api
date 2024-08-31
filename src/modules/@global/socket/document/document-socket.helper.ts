import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentSocketGatewayHelper {
  buildFSLockName(fsId: number) {
    return `fs::lock::${fsId}`;
  }
}
