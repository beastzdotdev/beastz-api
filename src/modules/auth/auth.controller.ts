import { Controller, Get } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from '../@global/database/database.decorator';
import { MainDatabase } from '../app.controller';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectKysely()
    private readonly db: Kysely<MainDatabase>,
  ) {}

  @Get('/health')
  getHello() {
    return this.db.selectFrom('users').selectAll().execute();
  }
}
