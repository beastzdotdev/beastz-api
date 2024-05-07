import { DynamicModule, Global, Logger, Module, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables } from './env.dto';
import { getAllErrorConstraints } from '../../../common/helper';
import { EnvService } from './env.service';
import { ENV_SERVICE_TOKEN } from './env.constants';
import { EnvModuleOptions } from './env.interface';

@Global()
@Module({})
export class EnvModule {
  public static readonly envLogger = new Logger(EnvModule.name);

  /**
   *
   * @default isGlobal:true
   * @default ignoreEnvVars:true
   * @returns {DynamicModule}
   *
   */
  public static forRoot(options?: EnvModuleOptions): DynamicModule {
    this.envLogger.verbose('Started initializing enviroment variables');

    const provider: Provider = {
      provide: ENV_SERVICE_TOKEN,
      useClass: EnvService,
    };

    return {
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true, // predefined/system environment variables will not be validated
          validate: (configuration: Record<keyof EnvironmentVariables, string | null | unknown>) => {
            console.log('='.repeat(20) + 1);
            console.log(process.env);
            console.log('='.repeat(20) + 2);
            console.log(configuration);

            const finalConfig = plainToClass(EnvironmentVariables, configuration, {
              exposeDefaultValues: true,
              enableImplicitConversion: false,
            });

            console.log(finalConfig);
            console.log(JSON.stringify(finalConfig));

            const errors = validateSync(finalConfig, {
              forbidNonWhitelisted: false,
              forbidUnknownValues: false,
              whitelist: true,
              enableDebugMessages: true,
            });
            console.log(errors);
            console.log('='.repeat(20));

            if (errors.length > 0) {
              const errorConstraints = getAllErrorConstraints(errors);
              errorConstraints.forEach(e => this.envLogger.error(e));
            } else {
              this.envLogger.verbose('Enviroment initialized');
            }

            return finalConfig;
          },
          ...options,
        }),
      ],
      module: EnvModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
