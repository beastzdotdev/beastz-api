import { Controller, Get } from '@nestjs/common';
import { NoAuth } from '../decorator/no-auth.decorator';

@Controller()
export class AppController {
  constructor() {}

  @NoAuth()
  @Get('health')
  healthCheck() {
    return 'ok';
  }
}
