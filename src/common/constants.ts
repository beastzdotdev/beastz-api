export const constants = Object.freeze({
  MAX_STORAGE_PER_USER_IN_BYTES: 1024 ** 3 * 30, // 30 gigabytes in bytes

  ENCRYPTED_EXTENSION: '.enc',

  PLATFORM_HEADER_NAME: 'platform',
  AUTH_HEADER_NAME: 'Authorization',
  COOKIE_ACCESS_NAME: 'access_token',
  COOKIE_REFRESH_NAME: 'refresh_token',

  ONE_DAY_IN_SEC: 24 * 3600,
  MILLIS_IN_HOUR: 1000 * 3600,

  get MILLIS_IN_DAY() {
    return this.MILLIS_IN_HOUR * 24;
  },

  get MILLIS_IN_YEAR() {
    return this.MILLIS_IN_DAY * 365;
  },

  JWT_ISSUER: 'gorilla-vault-auth',
  EMAIL_REGEX: new RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
  ),

  ONE_TIME_CODE_MIN: 100000,
  ONE_TIME_CODE_MAX: 999999,

  MAX_ATTEMPT_COUNT: 20,

  SYMBOLS: '!#$%&*?@',
  LETTERS_LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  LETTERS_UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LETTERS_BOTH: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  HEX: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ASCII: '!#$%&*?@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',

  frontendPath: {
    resetPassword: (base: string) => base,
    accountVerify: (base: string) => base,
    recoverPassword: (base: string) => `${base}/auth/sign-in`,
  },

  singleFileMaxSize: 30 * 1024 * 1024, // ~30mb

  assets: {
    publicAssets: 'public',
    publicAssetsImage: 'public/img',

    hubFolderName: 'hub',
    useSupportFolderName: 'hub/user-support',
    userTempFolderZipFolerName: 'hub/user-temp-folder-zip',

    userContentFolderName: 'user-content',
    userUploadFolderName: 'user-upload',
    userBinFolderName: 'user-bin',
    userDeleteForeverFolderName: 'user-deleted-forever',
  },
});
