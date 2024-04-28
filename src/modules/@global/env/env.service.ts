import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.dto';
import { EnvironmentType } from './env.interface';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  get<T extends keyof EnvironmentVariables>(key: T): EnvironmentVariables[T] {
    return this.configService.getOrThrow<EnvironmentVariables[T]>(key);
  }

  getInstance() {
    return this.configService;
  }

  isProd(): boolean {
    return this.get('DEBUG') === EnvironmentType.PROD;
  }

  isDev(): boolean {
    return this.get('DEBUG') === EnvironmentType.DEV;
  }
}

export const envService = new EnvService(new ConfigService<EnvironmentVariables>());
