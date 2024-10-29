import { EnvService } from '@global/env';
import { Prisma } from '@prisma/client';

export const prismaConfig = (env: EnvService): Prisma.PrismaClientOptions => {
  const config: Prisma.PrismaClientOptions = {
    datasources: {
      db: {
        url: env.get('DATABASE_URL'),
      },
    },
    log: [
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
      {
        emit: 'event',
        level: 'error',
      },
    ],
  };

  if (env.get('DATABASE_LOG_QUERY')) {
    config.log?.push({
      emit: 'event',
      level: 'query',
    });
  }

  return config;
};
