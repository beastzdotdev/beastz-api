import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
    let config: Prisma.PrismaClientOptions = {
      datasources: {
        db: {
          url: envService.get('DATABASE_URL'),
        },
      },
      log: [
        'warn',
        'error',
        {
          emit: 'event',
          level: 'info',
        },
      ],
    };

    if (envService.get('DATABASE_LOG_QUERY')) {
      config.log?.push('query');
    }

    super(config);
  }

  async onModuleInit() {
    await this.$connect().then(async () => {
      this.logger.verbose('Database connection successfull');
      this.logger.verbose('Database log query enabled: ' + this.envService.get('DATABASE_LOG_QUERY'));
    });

    this.$on('info', e => {
      this.logger.verbose(e.message);
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

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
