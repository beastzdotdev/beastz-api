import { PlatformForJwt } from '@prisma/client';

export class PlatformWrapper {
  constructor(private platform: PlatformForJwt) {}

  getPlatform() {
    return this.platform;
  }

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
