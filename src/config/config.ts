import { ConfigService } from '@nestjs/config';
import { getBoolExact } from 'src/common/helper';

//TODO move types for @types/ folder
//TODO remove some as operators from envVonfig and add env validator using class validator
//TODO https://javascript.plainenglish.io/nestjs-how-to-store-read-and-validate-environment-variable-using-nestjs-config-40a5fa0702e4

type Debug = 'dev' | 'prod';

export interface EnvConfig {
  debug: Debug;
  port: number;
  runAutoMigrate: boolean | null;
}

export const envVonfig = (): EnvConfig => ({
  debug: (process.env.DEBUG as Debug | undefined) || 'dev',
  port: parseInt(process.env.PORT as string),
  runAutoMigrate:
    getBoolExact(process.env.RUN_AUTO_MIGRATE) === null ? true : getBoolExact(process.env.RUN_AUTO_MIGRATE), // default is true
});

export const getEnv = <T extends keyof EnvConfig>(cls: ConfigService<EnvConfig>, key: T): EnvConfig[T] => {
  return cls.get(key, { infer: true }) as unknown as EnvConfig[T];
};
