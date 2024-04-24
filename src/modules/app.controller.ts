import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { NoAuth } from '../decorator/no-auth.decorator';
import { AuthPayload } from '../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../model/auth.types';
import { AppService } from './app.service';
import {
  absUserContentPath,
  absUserUploadPath,
  absUserBinPath,
  absUserSupportPath,
} from './file-structure/file-structure.helper';

@Controller()
export class AppController {
  private readonly cachedAbsUserContentPath: string = absUserContentPath();
  private readonly cachedAbsUserUploadPath: string = absUserUploadPath();
  private readonly cachedAbsUserBinPath: string = absUserBinPath();
  private readonly cachedAbsUserSupportPath: string = absUserSupportPath();

  constructor(private readonly appService: AppService) {}

  @NoAuth()
  @Get('health')
  healthCheck() {
    return 'ok';
  }

  @Get('health/secure')
  checkHealthForAuth() {
    return 'ok';
  }

  @Get('user-content/?*')
  async protectedUserContent(@Req() req: Request, @Res() res: Response, @AuthPayload() authPayload: AuthPayloadType) {
    return this.appService.serveStaticProtected(req, res, authPayload, this.cachedAbsUserContentPath);
  }

  @Get('user-upload/?*')
  async protectedUserUpload(@Req() req: Request, @Res() res: Response, @AuthPayload() authPayload: AuthPayloadType) {
    return this.appService.serveStaticProtected(req, res, authPayload, this.cachedAbsUserUploadPath);
  }

  @Get('user-bin/?*')
  async protectedUserBin(@Req() req: Request, @Res() res: Response, @AuthPayload() authPayload: AuthPayloadType) {
    return this.appService.serveStaticProtected(req, res, authPayload, this.cachedAbsUserBinPath);
  }

  @Get('hub/?*')
  async protectedHub(@Req() req: Request, @Res() res: Response, @AuthPayload() authPayload: AuthPayloadType) {
    return this.appService.serveStaticProtected(req, res, authPayload, this.cachedAbsUserSupportPath);
  }
}
