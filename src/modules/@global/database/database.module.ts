import { DynamicModule, Global, Logger, Module, Provider } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { KYSELY_MODULE_CONNECTION_TOKEN } from './database.constants';
import { ConfigModule } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

interface AsyncConfig {
  poolConfig: PoolConfig;
}

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {
  public static readonly databaseLogger = new Logger('Kysely Databse Logger');

  public static forRootAsync<DB>(configs: AsyncConfig): DynamicModule {
    const provider: Provider = {
      provide: KYSELY_MODULE_CONNECTION_TOKEN,
      useFactory: async () => {
        const dialect = new PostgresDialect({
          pool: new Pool(configs.poolConfig),
        });

        const db = new Kysely<DB>({
          dialect,
        });

        try {
          await sql`select 1`.execute(db);
          this.databaseLogger.verbose('Database connection sucessfull');
        } catch (error) {
          this.databaseLogger.error('Connection error');
          console.log(error);
        }

        return db;
      },
    };

    return {
      imports: [ConfigModule],
      module: DatabaseModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
