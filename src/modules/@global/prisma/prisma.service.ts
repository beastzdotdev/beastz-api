import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { EnvService } from '../env/env.service';
import { InjectEnv } from '../env/env.decorator';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {
    const config: Prisma.PrismaClientOptions = {
      datasources: {
        db: {
          url: envService.get('DATABASE_URL'),
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

    if (envService.get('DATABASE_LOG_QUERY')) {
      config.log?.push({
        emit: 'event',
        level: 'query',
      });
    }

    super(config);
  }

  async onModuleInit() {
    //TODO save this logs in database

    await this.$connect().then(async () => {
      this.logger.verbose('Database connection successfull');
      this.logger.verbose('Database log query enabled: ' + this.envService.get('DATABASE_LOG_QUERY'));
    });

    this.$on('info', e => {
      this.logger.verbose(e.message);
    });

    this.$on('warn', e => {
      this.logger.warn(e.message);
    });

    this.$on('error', e => {
      this.logger.error(e.message);
    });

    if (this.envService.get('DATABASE_LOG_QUERY')) {
      this.$on('query', e => {
        this.logger.debug('Query: ' + e.query);
        this.logger.debug('Params: ' + e.params);
        this.logger.debug('Duration: ' + e.duration + 'ms');
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
