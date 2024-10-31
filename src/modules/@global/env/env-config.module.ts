import { performance } from 'node:perf_hooks';
import { DynamicModule, Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvService } from './env.service';
import { ENV_SERVICE_TOKEN } from './env.constants';
import { EnvModuleOptions } from './env.interface';
import { envConfig } from './env.config';

@Global()
@Module({})
export class EnvConfigModule {
  private static readonly envLogger = new Logger(EnvConfigModule.name);

  /**
   * @default isGlobal:true
   * @default ignoreEnvVars:true
   */
  static forRoot(options?: EnvModuleOptions): DynamicModule {
    const time = performance.now();

    this.envLogger.verbose('Started initializing enviroment variables');

    const provider: Provider = {
      provide: ENV_SERVICE_TOKEN,
      useClass: EnvService,
    };

    return {
      imports: [
        ConfigModule.forRoot(
          envConfig({
            envLogger: this.envLogger,
            time,
            options,
          }),
        ),
      ],
      module: EnvConfigModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
