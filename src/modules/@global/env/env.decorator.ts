import { Inject } from '@nestjs/common';
import { ENV_SERVICE_TOKEN } from './env.constants';

export const InjectEnv = () => Inject(ENV_SERVICE_TOKEN);
