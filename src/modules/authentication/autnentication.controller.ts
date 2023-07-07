import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { AuthenticationService } from './authentication.service';
import {
  AccountVerificationConfirmCodeDto,
  AuthenticationPayloadResponseDto,
  RecoverPasswordConfirmCodeBodyDto,
  RecoverPasswordDto,
  RecoverPasswordSendVerificationCodeBodyDto,
  RefreshTokenBodyDto,
  SignInBodyDto,
  SignUpBodyDto,
} from './dto';
import { RecoverpasswordConfirmCodePayloadDto } from './dto/recover-password-confirm-code-payload.dto';
import { UserPayload } from '../../model/user-payload.type';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { NoEmailVerifyValidate } from '../../decorator/no-email-verify-validate.decorator';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @NoAuth()
  @Post('sign-up')
  async signUp(@Body() body: SignUpBodyDto): Promise<AuthenticationPayloadResponseDto> {
    return this.authenticationService.signUpWithToken(body);
  }

  @NoAuth()
  @Post('sign-in')
  async signIn(@Body() body: SignInBodyDto): Promise<AuthenticationPayloadResponseDto> {
    return this.authenticationService.signInWithToken(body);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenBodyDto): Promise<AuthenticationPayloadResponseDto> {
    return this.authenticationService.refreshToken(body.refreshToken);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('recover-password/send-verification-code')
  async recoverPasswordSendVerificationCode(@Body() body: RecoverPasswordSendVerificationCodeBodyDto): Promise<void> {
    await this.authenticationService.recoverPasswordSendVerificationCode(body.email);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('recover-password/confirm-code')
  async recoverPasswordConfirmCode(
    @Body() body: RecoverPasswordConfirmCodeBodyDto,
  ): Promise<RecoverpasswordConfirmCodePayloadDto> {
    return this.authenticationService.recoverPasswordConfirmCode(body);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('recover-password')
  async recoverPassword(@Body() body: RecoverPasswordDto): Promise<void> {
    await this.authenticationService.recoverPassword(body);
  }

  @NoEmailVerifyValidate()
  @HttpCode(HttpStatus.OK)
  @Post('account-verification/send-code')
  async sendAccountVerificationCode(@AuthPayload() authUser: UserPayload) {
    await this.authenticationService.sendAccountVerificationCode(authUser.userId);
  }

  @NoEmailVerifyValidate()
  @HttpCode(HttpStatus.OK)
  @Post('account-verification/confirm-code')
  async accountVerificationConfirmCode(
    @AuthPayload() authPayload: UserPayload,
    @Body() body: AccountVerificationConfirmCodeDto,
  ) {
    await this.authenticationService.accountVerificationConfirmCode(authPayload.userId, body.code);
  }
}
