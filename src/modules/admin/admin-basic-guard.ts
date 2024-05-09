import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { EnvService } from '../@global/env/env.service';
import { InjectEnv } from '../@global/env/env.decorator';
import { constants } from '../../common/constants';

@Injectable()
export class AdminBasicGuard implements CanActivate {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!this.envService.get('ADMIN_BASIC_PASSWORD')?.trim()) {
      return false;
    }

    return request.headers?.[constants.ADMIN_BASIC_PASS_HEADER_NAME] === this.envService.get('ADMIN_BASIC_PASSWORD');
  }
}
