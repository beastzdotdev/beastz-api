import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { AuthenticationService } from './authentication.service';
import { Response } from 'express';
import { AuthPlatformHeaderGuard } from './guard/auth-platform-header.guard';
import { PlatformHeader } from '../../decorator/platform-header.decorator';
import { CookieStrict } from '../../decorator/cookie-decorator';
import { Constants } from '../../common/constants';
import { PlatformWrapper } from '../../model/platform.wrapper';
import { AccountVerifySendCodeDto } from './dto/account-verify-send-code.dto';
import { NoPlatformHeader } from '../../decorator/no-platform-header.decorator';
import {
  AccountVerificationConfirmQueryDto,
  RecoverPasswordSendDto,
  RecoverPasswordVerifyQueryDto as RecoverPasswordConfirmQueryDto,
  RefreshTokenBodyDto,
  SignInBodyDto,
  SignUpBodyDto,
} from './dto';
import { ResetPasswordBodyDto } from './dto/reset-password-body.dto';
import { platform } from 'os';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';

@UseGuards(AuthPlatformHeaderGuard)
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @NoAuth()
  @Post('sign-up')
  async signUp(
    @Body() body: SignUpBodyDto,
    @Res() res: Response,
    @PlatformHeader() platform: PlatformWrapper,
  ): Promise<Response> {
    return this.authenticationService.signUpWithToken(res, body, platform);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() body: SignInBodyDto,
    @Res() res: Response,
    @PlatformHeader() platform: PlatformWrapper,
  ): Promise<Response> {
    return this.authenticationService.signInWithToken(res, body, platform);
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshByCookie(
    @Res() res: Response,
    @PlatformHeader() platform: PlatformWrapper,
    @CookieStrict({
      cookieName: Constants.COOKIE_REFRESH_NAME,
      cls: UnauthorizedException,
      message: 'Missing refresh token',
    })
    refreshToken?: string,
  ): Promise<Response> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing token');
    }

    return this.authenticationService.refreshToken(res, { oldRefreshTokenString: refreshToken }, platform);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body() body: ResetPasswordBodyDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<{ msg: string }> {
    await this.authenticationService.resetPassword(body, authPayload.user.id);
    return { msg: 'Reset password successfull' };
  }

  @NoAuth()
  @HttpCode(HttpStatus.OK)
  @Post('refresh/by-body')
  async refreshByBody(
    @Body() body: RefreshTokenBodyDto,
    @Res() res: Response,
    @PlatformHeader() platform: PlatformWrapper,
  ): Promise<Response> {
    return this.authenticationService.refreshToken(res, { oldRefreshTokenString: body.refreshToken }, platform);
  }

  @NoAuth()
  @NoPlatformHeader()
  @HttpCode(HttpStatus.OK)
  @Post('recover-password/send')
  async recoverPasswordSend(@Body() body: RecoverPasswordSendDto): Promise<void> {
    await this.authenticationService.recoverPasswordSend(body.email);
  }

  @NoAuth()
  @NoPlatformHeader()
  @HttpCode(HttpStatus.OK)
  @Post('account-verify/send')
  async sendAccountVerificationCode(@Body() body: AccountVerifySendCodeDto) {
    await this.authenticationService.accountVerifySend(body.email);
  }

  @NoAuth()
  @NoPlatformHeader()
  @Get('recover-password/confirm')
  async recoverPassword(@Query() body: RecoverPasswordConfirmQueryDto): Promise<void> {
    await this.authenticationService.recoverPasswordConfirm(body);
  }

  @NoAuth()
  @NoPlatformHeader()
  @Get('account-verify/confirm')
  async accountVerificationConfirmCode(@Query() body: AccountVerificationConfirmQueryDto) {
    await this.authenticationService.accountVerificationConfirm(body);
  }
}
