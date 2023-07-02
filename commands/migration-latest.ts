import 'dotenv/config';

import { migrateCommand } from '../src/common/migrate';

migrateCommand(
  {
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    port: parseInt(process.env.DATABASE_PORT || '0'),
    max: parseInt(process.env.DATABASE_MAX_POOL || '0'),
  },
  'latest',
);
