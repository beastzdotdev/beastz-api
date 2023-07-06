import { Controller, Get } from '@nestjs/common';
import { EnvService } from './@global/env/env.service';
import { InjectEnv } from './@global/env/env.decorator';

@Controller()
export class AppController {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  @Get('/health')
  async getHello() {
    return {
      dbPort: this.envService.get('DATABASE_URL'),
    };
  }
}
