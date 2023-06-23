import { DynamicModule, Global, Logger, Module, Provider } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Kysely, KyselyConfig, sql } from 'kysely';
import { KYSELY_MODULE_CONNECTION_TOKEN, KYSELY_MODULE_OPTIONS_TOKEN } from './database.constants';
import { DatabseKyselyModuleAsyncOptions } from './database.interface';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {
  public static readonly databaseLogger = new Logger('Kysely Databse Logger');

  public static forRootAsync<DB>(configs: DatabseKyselyModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      inject: configs.inject,
      provide: KYSELY_MODULE_OPTIONS_TOKEN,
      useFactory: configs.useFactory,
    };

    const connectionProvider: Provider = {
      inject: [KYSELY_MODULE_OPTIONS_TOKEN],
      provide: KYSELY_MODULE_CONNECTION_TOKEN,
      useFactory: async (config: KyselyConfig) => {
        const db = new Kysely<DB>(config);

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
      imports: configs.imports,
      module: DatabaseModule,
      providers: [optionsProvider, connectionProvider],
      exports: [connectionProvider],
    };
  }
}
