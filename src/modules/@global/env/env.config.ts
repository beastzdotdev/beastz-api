import type { ConfigModuleOptions } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';
import { EnvironmentVariables } from './env.dto';
import { getAllErrorConstraints } from '../../../common/helper';

type Params = {
  envLogger: Logger;
  time: number;
  options?: Omit<ConfigModuleOptions, 'validate'>;
};

export const envConfig = ({ envLogger, time, options }: Params): ConfigModuleOptions => ({
  isGlobal: true,
  ignoreEnvVars: false, // predefined/system environment variables will not be validated
  validate: (configuration: Record<keyof EnvironmentVariables, string | null | unknown>) => {
    // this.envLogger.verbose('Started validating enviroment variables');
    const finalConfig = plainToClass(EnvironmentVariables, configuration, {
      exposeDefaultValues: true,
      enableImplicitConversion: false,
    });

    console.log(finalConfig);

    const errors = validateSync(finalConfig, {
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      whitelist: true,
      enableDebugMessages: true,
    });

    if (errors.length > 0) {
      const errorConstraints = getAllErrorConstraints(errors);
      errorConstraints.forEach(e => envLogger.error(e));
    } else {
      envLogger.verbose('Enviroment all variable is valid');
    }

    const totalTimeInMs = (performance.now() - time).toFixed(3) + 'ms';
    envLogger.verbose(`Enviroment initialization completed (${totalTimeInMs})`);

    return finalConfig;
  },
  ...options,
});
