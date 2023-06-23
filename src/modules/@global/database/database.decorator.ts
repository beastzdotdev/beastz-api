import { Inject } from '@nestjs/common';
import { KYSELY_MODULE_CONNECTION_TOKEN } from './database.constants';

export const InjectKysely = () => Inject(KYSELY_MODULE_CONNECTION_TOKEN);
