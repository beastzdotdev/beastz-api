import { ConfigModuleOptions } from '@nestjs/config';

export type EnvModuleOptions = ConfigModuleOptions;

export enum EnvironmentType {
  DEV = 'DEV',
  PROD = 'PROD',
}
