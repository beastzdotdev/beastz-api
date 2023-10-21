import moment from 'moment';
import { Injectable } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { EnvService } from '../env/env.service';
import { InjectEnv } from '../env/env.decorator';
import { constants } from '../../../common/constants';

@Injectable()
export class CookieService {
  constructor(
    @InjectEnv()
    private readonly envService: EnvService,
  ) {}

  public clearCookie(res: Response): void {
    let cookieOptions: CookieOptions | undefined;

    if (this.envService.isProd()) {
      cookieOptions = { domain: this.envService.get('FRONTEND_URL') };
    }

    res.clearCookie(constants.COOKIE_ACCESS_NAME, cookieOptions);
    res.clearCookie(constants.COOKIE_REFRESH_NAME, cookieOptions);
  }

  public createCookie(res: Response, params: { accessToken?: string; refreshToken?: string }): void {
    const { accessToken, refreshToken } = params;

    const cookieOptions: CookieOptions = {};

    if (this.envService.isDev()) {
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }

    if (this.envService.isProd()) {
      cookieOptions.httpOnly = true;
      cookieOptions.sameSite = true;
      cookieOptions.domain = this.envService.get('FRONTEND_URL');
    }

    const accessDate = moment().add(this.envService.get('ACCESS_TOKEN_EXPIRATION_IN_SEC'), 'seconds').toDate();
    const refreshDate = moment().add(this.envService.get('REFRESH_TOKEN_EXPIRATION_IN_SEC'), 'seconds').toDate();

    if (accessToken) {
      res.cookie(constants.COOKIE_ACCESS_NAME, accessToken, { expires: accessDate, ...cookieOptions });
    }

    if (refreshToken) {
      res.cookie(constants.COOKIE_REFRESH_NAME, refreshToken, { expires: refreshDate, ...cookieOptions });
    }
  }
}
