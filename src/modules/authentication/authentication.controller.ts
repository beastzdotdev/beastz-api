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
import { Response } from 'express';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { AuthenticationService } from './authentication.service';
import { AuthPlatformHeaderGuard } from './guard/auth-platform-header.guard';
import { PlatformHeader } from '../../decorator/platform-header.decorator';
import { CookieStrict } from '../../decorator/cookie-decorator';
import { constants } from '../../common/constants';
import { PlatformWrapper } from '../../model/platform.wrapper';
import { NoPlatformHeader } from '../../decorator/no-platform-header.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import {
  AccountVerifySendCodeDto,
  AuthConfirmQueryDto,
  RecoverPasswordSendDto,
  RefreshTokenBodyDto,
  ResetPasswordBodyDto,
  SignInBodyDto,
  SignUpBodyDto,
} from './dto';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';

@UseGuards(AuthPlatformHeaderGuard)
@Controller('auth')
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
      cookieName: constants.COOKIE_REFRESH_NAME,
      cls: UnauthorizedException,
      message: 'Missing refresh token',
    })
    refreshToken?: string,
  ): Promise<Response> {
    if (!refreshToken) {
      throw new UnauthorizedException(ExceptionMessageCode.MISSING_TOKEN);
    }

    return this.authenticationService.refreshToken(res, { oldRefreshTokenString: refreshToken }, platform);
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

  @HttpCode(HttpStatus.OK)
  @Post('reset-password/send')
  async resetPasswordSend(
    @Body() body: ResetPasswordBodyDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<void> {
    await this.authenticationService.resetPasswordSend(body, authPayload.user.id);
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
  async sendAccountVerificationCode(@Body() body: AccountVerifySendCodeDto): Promise<void> {
    await this.authenticationService.accountVerifySend(body.email);
  }

  @NoAuth()
  @NoPlatformHeader()
  @Get('reset-password/confirm')
  async resetPasswordConfirm(@Query() body: AuthConfirmQueryDto): Promise<string> {
    await this.authenticationService.resetPasswordConfirm(body);
    return 'ok';
  }

  @NoAuth()
  @NoPlatformHeader()
  @Get('recover-password/confirm')
  async recoverPassword(@Query() body: AuthConfirmQueryDto): Promise<string> {
    await this.authenticationService.recoverPasswordConfirm(body);
    return 'ok';
  }

  @NoAuth()
  @NoPlatformHeader()
  @Get('account-verify/confirm')
  async accountVerificationConfirmCode(@Query() body: AuthConfirmQueryDto): Promise<string> {
    await this.authenticationService.accountVerificationConfirm(body);
    return 'ok';
  }
}
