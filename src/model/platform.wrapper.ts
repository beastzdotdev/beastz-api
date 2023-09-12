import { PlatformForJwt } from '@prisma/client';

export class PlatformWrapper {
  constructor(public platform: PlatformForJwt) {}

  isWeb() {
    return this.platform === PlatformForJwt.WEB;
  }

  isMobile() {
    return this.isAndroid() || this.isIos();
  }

  isAndroid() {
    return this.platform === PlatformForJwt.MOB_ANDROID;
  }

  isIos() {
    return this.platform === PlatformForJwt.MOB_IOS;
  }
}
