import { Request } from 'express';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EnvService, InjectEnv } from '@global/env';
import { constants } from '../../common/constants';

@Injectable()
export class AdminBasicGuard implements CanActivate {
  constructor(
    @InjectEnv()
    private readonly env: EnvService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!this.env.get('ADMIN_BASIC_PASSWORD')?.trim()) {
      return false;
    }

    return request.headers?.[constants.ADMIN_BASIC_PASS_HEADER_NAME] === this.env.get('ADMIN_BASIC_PASSWORD');
  }
}
