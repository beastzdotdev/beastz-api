import { ConfigModuleOptions } from '@nestjs/config';

export type EnvModuleOptions = ConfigModuleOptions;

export enum EnvironmentType {
  Dev = 'dev',
  Prod = 'prod',
}
