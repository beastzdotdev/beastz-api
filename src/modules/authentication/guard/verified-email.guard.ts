import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { NO_EMAIL_VERIFY_VALIDATE } from '../../../decorator/no-email-verify-validate.decorator';
import { AuthPayloadAndRequest } from '../../../model/auth.types';
import { UserNotVerifiedException } from '../../../exceptions/user-not-verified.exception';

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
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

    const request = context.switchToHttp().getRequest<AuthPayloadAndRequest>();
    const isAccountVerified = request.user.userIdentity?.isAccountVerified ?? false;

    if (!isAccountVerified) {
      throw new UserNotVerifiedException();
    }

    return true;
  }
}
