import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountVerificationService } from '../account-verification/account-verification.service';
import { NO_AUTH_KEY } from '../../../decorator/no-auth.decorator';
import { NO_EMAIL_VERIFY_VALIDATE } from '../../../decorator/no-email-verify-validate.decorator';
import { ExceptionMessageCode } from '../../../exceptions/exception-message-code.enum';
import { JwtUtilService } from '../../../common/modules/jwt-util/jwt-util.service';

@Injectable()
export class VerifiedEmailValidatorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtUtilService: JwtUtilService,
    private readonly accountVerificationService: AccountVerificationService,
  ) {}

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

    const request = context.switchToHttp().getRequest();

    const authorizationHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authorizationHeader) {
      return false;
    }

    const accessToken = authorizationHeader.slice('Bearer '.length);

    if (!accessToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const payload = this.jwtUtilService.getUserPayload(accessToken);

    if (!payload) {
      throw new UnauthorizedException(ExceptionMessageCode.INVALID_TOKEN);
    }

    return this.accountVerificationService.getIsVerifiedByUserId(payload.userId);
  }
}
