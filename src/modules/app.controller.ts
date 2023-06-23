import { Controller, Get } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from './@global/database/database.decorator';

// create table users
// (
//     id            serial
//     is_online     boolean      default false             not null,
//     email         varchar(255)                           not null,
//     user_name     varchar(255)                           not null,
//     birth_date    timestamp(3)                           not null,
//     gender        gender                                 not null,
//     password_hash varchar(255)                           not null,
//     created_at    timestamp(3) default CURRENT_TIMESTAMP not null,
//     socket_id     varchar(32)                            not null
// );

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
  ) {}

  @Get('/health')
  getHello() {
    return this.db.selectFrom('users').selectAll().execute();
  }
}
