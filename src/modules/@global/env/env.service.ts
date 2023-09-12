import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.dto';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  get<T extends keyof EnvironmentVariables>(key: T): EnvironmentVariables[T] {
    return this.configService.get(key) as unknown as EnvironmentVariables[T];
  }

  getInstance() {
    return this.configService;
  }

  isProd(): boolean {
    return this.get('DEBUG') !== 'dev';
  }
}
