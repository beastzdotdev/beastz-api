import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { NO_EMAIL_VERIFY_VALIDATE } from '../../../decorator/no-email-verify-validate.decorator';
import { AuthPayloadRequest } from '../../../model/auth.types';

@Injectable()
export class VerifiedEmailValidatorGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const noAuth = this.reflector.getAllAndOverride<boolean>(NO_AUTH_KEY, [context.getHandler(), context.getClass()]);

    if (noAuth) {
      return true;
    }

    const noEmailVerifyValidate = this.reflector.getAllAndOverride<boolean>(NO_EMAIL_VERIFY_VALIDATE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (noEmailVerifyValidate) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthPayloadRequest>();

    return request.userForGuard.userIdentity?.isAccountVerified ?? false;
  }
}
