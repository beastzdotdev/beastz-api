import { performance } from 'node:perf_hooks';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { EnvService } from '../env/env.service';
import { InjectEnv } from '../env/env.decorator';
import { prismaConfig } from './prisma.config';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    @InjectEnv()
    private readonly env: EnvService,
  ) {
    super(prismaConfig(env));
  }

  async onModuleInit() {
    const time = performance.now();
    //TODO save this logs in database

    await this.$connect().then(async () => {
      this.logger.verbose('Database log query enabled: ' + this.env.get('DATABASE_LOG_QUERY'));
      const totalTimeInMs = (performance.now() - time).toFixed(3) + 'ms';
      this.logger.verbose(`Database connection successfull (${totalTimeInMs})`);
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

    if (this.env.get('DATABASE_LOG_QUERY')) {
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
