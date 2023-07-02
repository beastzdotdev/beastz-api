import { Controller, Get } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from './@global/database/database.decorator';
import { EnvService } from './@global/env/env.service';
import { InjectEnv } from './@global/env/env.decorator';

interface User {
  id: string;
  is_online: string;
  email: string;
  user_name: string;
  birth_date: string;
  gender: string;
  password_hash: string;
  created_at: string;
  socket_id: string;
}

export interface MainDatabase {
  users: User;
}

@Controller()
export class AppController {
  constructor(
    @InjectKysely()
    private readonly db: Kysely<MainDatabase>,

    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  @Get('/health')
  getHello() {
    return {
      users: this.db.selectFrom('users').selectAll().execute(),
      dbPort: this.envService.get('DATABASE_PORT'),
    };
  }
}
