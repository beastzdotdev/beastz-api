export class Constants {
  static readonly PLATFORM_HEADER_NAME = 'platform';
  static readonly AUTH_HEADER_NAME = 'Authorization';
  static readonly COOKIE_ACCESS_NAME = 'access_token';
  static readonly COOKIE_REFRESH_NAME = 'refresh_token';

  static readonly MILLIS_IN_HOUR = 10000 * 3600;
  static readonly MILLIS_IN_DAY = Constants.MILLIS_IN_HOUR * 24;
  static readonly MILLIS_IN_YEAR = Constants.MILLIS_IN_DAY * 365;
  static readonly JWT_ISSUER = 'gorilla-vault-auth';
  static readonly EMAIL_REGEX = new RegExp(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
  );
}
