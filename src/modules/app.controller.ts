import { Controller, Get } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from './@global/database/database.decorator';
import { EnvService } from './@global/env/env.service';
import { InjectEnv } from './@global/env/env.decorator';

@Controller()
export class AppController {
  constructor(
    @InjectKysely()
    private readonly db: Kysely<unknown>,

    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  @Get('/health')
  async getHello() {
    return {
      tables: this.db.introspection.getTables(),
      dbPort: this.envService.get('DATABASE_PORT'),
    };
  }
}
