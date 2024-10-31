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
    private readonly env: EnvService,
  ) {}

  clearCookie(res: Response): void {
    let cookieOptions: CookieOptions | undefined;

    if (this.env.isProd()) {
      cookieOptions = { domain: this.env.get('FRONTEND_URL') };
    }

    res.clearCookie(constants.COOKIE_ACCESS_NAME, cookieOptions);
    res.clearCookie(constants.COOKIE_REFRESH_NAME, cookieOptions);
  }

  createCookie(res: Response, params: { accessToken?: string; refreshToken?: string }): void {
    const { accessToken, refreshToken } = params;

    const cookieOptions: CookieOptions = {
      signed: true,
    };

    if (this.env.isDev()) {
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }

    if (this.env.isProd()) {
      cookieOptions.httpOnly = true;
      cookieOptions.sameSite = true;
      cookieOptions.secure = true;
      cookieOptions.domain = this.env.get('COOKIE_DOMAIN');
    }

    const expires = moment().add(10, 'year').toDate();

    if (accessToken) {
      res.cookie(constants.COOKIE_ACCESS_NAME, accessToken, { expires, ...cookieOptions });
    }

    if (refreshToken) {
      res.cookie(constants.COOKIE_REFRESH_NAME, refreshToken, { expires, ...cookieOptions });
    }
  }
}
