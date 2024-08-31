import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { PlatformForJwt } from '@prisma/client';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { encryption } from '../../../../common/encryption';
import { enumValueIncludes } from '../../../../common/helper';
import { SocketError } from '../../../../exceptions/socket.exception';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { PlatformWrapper } from '../../../../model/platform.wrapper';
import { InjectEnv } from '../../env/env.decorator';
import { EnvService } from '../../env/env.service';
import { JwtService } from '../../jwt/jwt.service';
import { constants } from '../../../../common/constants';
import { SocketForUserInject } from './document-socket.type';

/**
 * @description
 * ! Chose guard only because interceptor cannot stop execution if error happens
 * ! And also here socket signature validation does not happen because I don't need to check
 * ! Validity of token on every event because it's already done when connection is established
 * ! Here I only need token public payload for user id
 */
@Injectable()
export class DocumentSocketTokenExtractGuard implements CanActivate {
  private readonly logger = new Logger(DocumentSocketTokenExtractGuard.name);

  constructor(
    @InjectEnv()
    private readonly envService: EnvService,

    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<SocketForUserInject>();
    return this.errorWrapper(socket, () => this.interceptEvent(socket));
  }

  async errorWrapper(socket: SocketForUserInject, callback: () => Promise<void>): Promise<boolean> {
    try {
      await callback();
      return true;
    } catch (error) {
      // server intended error
      if (error instanceof SocketError) {
        socket.emit('error', error);
        return false;
      }

      // non intended error
      if (error instanceof Error) {
        socket.emit(
          'error',
          new SocketError('Something went wrong', {
            description: `Caught general error (UNINTENDED ERROR)`,

            ...(this.envService.isDev() && {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }),
          }),
        );
        return false;
      }

      // some unexpected error
      socket.emit(
        'error',
        new SocketError('Something went wrong', {
          description: 'Problem with server (UNINTENDED ERROR)',
        }),
      );

      return false;
    }
  }

  private async interceptEvent(socket: SocketForUserInject) {
    const { authorizationHeader, platform } = this.validateHeaders(socket);

    let accessToken: string | undefined;

    console.log('='.repeat(20));
    console.log(socket.handshake);

    if (platform.isWeb() && socket.handshake.headers.cookie) {
      const accessTokenSigned = cookie.parse(socket.handshake.headers.cookie)?.[constants.COOKIE_ACCESS_NAME];

      const temp = cookieParser.signedCookie(accessTokenSigned, this.envService.get('COOKIE_SECRET'));

      if (!temp) {
        this.logger.debug(`Invalid signature for signed cookie access token: ${accessTokenSigned}`);
        throw new ForbiddenException(ExceptionMessageCode.INVALID_TOKEN);
      }

      accessToken = temp;
    }

    if (platform.isMobile()) {
      accessToken = authorizationHeader.slice('Bearer '.length);
    }

    if (!accessToken) {
      throw new NotFoundException(ExceptionMessageCode.MISSING_TOKEN);
    }

    let finalAccessToken: string | undefined | null = null;

    // Decrypt is session is enabled
    const isEncryptionSessionActive = this.envService.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');

    if (isEncryptionSessionActive) {
      const key = this.envService.get('SESSION_JWT_ENCRYPTION_KEY');
      finalAccessToken = await encryption.aes256gcm.decrypt(accessToken, key);
    } else {
      finalAccessToken = accessToken;
    }

    if (!finalAccessToken) {
      throw new ForbiddenException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const accessTokenPayload = this.jwtService.getAccessTokenPayload(finalAccessToken);

    //! adding extra property to socket handshake here
    socket.handshake.accessTokenPayload = accessTokenPayload;
  }

  private validateHeaders(socket: SocketForUserInject) {
    const authorizationHeader =
      <string>socket.handshake.headers[constants.AUTH_HEADER_NAME.toLowerCase()] ||
      <string>socket.handshake.headers[constants.AUTH_HEADER_NAME];

    const platformValue = socket.handshake.query?.[constants.PLATFORM_HEADER_NAME] as PlatformForJwt;

    if (!platformValue) {
      throw new ForbiddenException(`Header missing "${constants.PLATFORM_HEADER_NAME}"`);
    }

    if (!enumValueIncludes(PlatformForJwt, platformValue)) {
      throw new ForbiddenException(`Missing header/value "${constants.PLATFORM_HEADER_NAME}"`);
    }

    const platform = new PlatformWrapper(platformValue);

    if (platform.isMobile() && !authorizationHeader) {
      throw new ForbiddenException(
        `Missing header/value "${constants.AUTH_HEADER_NAME}" or "${constants.AUTH_HEADER_NAME.toLowerCase()}"`,
      );
    }

    return {
      authorizationHeader,
      platform: new PlatformWrapper(platformValue),
    };
  }
}
