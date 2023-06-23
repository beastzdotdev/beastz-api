import { Abstract, ModuleMetadata, Type } from '@nestjs/common';
import { KyselyConfig } from 'kysely';

type InjectType = (string | symbol | Type<any> | Abstract<any> | (() => void))[];

export interface DatabseKyselyModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject: InjectType;
  useFactory: (...args: any[]) => Promise<KyselyConfig> | KyselyConfig;
}
