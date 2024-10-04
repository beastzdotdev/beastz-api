import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import { Socket } from 'socket.io';
import { PlatformForJwt } from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { encryption } from '../../../../common/encryption';
import { enumValueIncludes } from '../../../../common/helper';
import { AccessTokenExpiredException } from '../../../../exceptions/access-token-expired.exception';
import { SocketError } from '../../../../exceptions/socket.exception';
import { TokenExpiredException } from '../../../../exceptions/token-expired-forbidden.exception';
import { ExceptionMessageCode } from '../../../../model/enum/exception-message-code.enum';
import { PlatformWrapper } from '../../../../model/platform.wrapper';
import { InjectEnv } from '../../env/env.decorator';
import { EnvService } from '../../env/env.service';
import { JwtService } from '../../jwt/jwt.service';
import { constants } from '../../../../common/constants';
import { DocumentSocket } from './document-socket.type';
import { UserService } from '../../../user/user.service';

@Injectable()
export class DocumentSocketInitMiddleware {
  private readonly logger = new Logger(DocumentSocketInitMiddleware.name);

  constructor(
    @InjectEnv()
    private readonly env: EnvService,

    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  AuthWsMiddleware() {
    return async (socket: Socket | DocumentSocket, next: (err?: Error) => void) => {
      console.log('='.repeat(20));
      // console.log(socket);
      console.log(socket.handshake);

      try {
        const isServant = socket.handshake.auth?.sharedUniqueHash;
        socket.handshake['isServant'] = isServant;

        if (isServant) {
          this.validateServant(socket as DocumentSocket);
        } else {
          await this.validate(socket as DocumentSocket);

          if (!socket.handshake.auth?.filesStructureId) {
            throw new NotFoundException(ExceptionMessageCode.DOCUMENT_ID_MISSING);
          }
        }

        next();
      } catch (error) {
        // server intended error
        if (error instanceof SocketError) {
          next(error);
          return;
        }

        // non intended error
        if (error instanceof Error) {
          next(
            new SocketError('Something went wrong', {
              description: `Caught general error (UNINTENDED ERROR)`,

              ...(this.env.isDev() && {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }),
            }),
          );
          return;
        }

        // some unexpected error
        next(
          new SocketError('Something went wrong', {
            description: 'Problem with server (UNINTENDED ERROR)',
          }),
        );
      }
    };
  }
  private validateServant(socket: DocumentSocket) {
    if (!socket.handshake.isServant) {
      this.logger.debug('Validating servant and was not servant');
      throw new InternalServerErrorException('This should not happend');
    }

    // I guess for now nothing is here to validate but in future it will be needed
  }

  private async validate(socket: DocumentSocket) {
    if (socket.handshake.isServant) {
      this.logger.debug('Validating user and was servant');
      throw new InternalServerErrorException('THis should not happend');
    }

    const { authorizationHeader, platform } = this.validateHeaders(socket);

    let accessToken: string | undefined;

    if (platform.isWeb() && socket.handshake.headers.cookie) {
      const accessTokenSigned = cookie.parse(socket.handshake.headers.cookie)?.[constants.COOKIE_ACCESS_NAME];

      const temp = cookieParser.signedCookie(accessTokenSigned, this.env.get('COOKIE_SECRET'));

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
    const isEncryptionSessionActive = this.env.get('ENABLE_SESSION_ACCESS_JWT_ENCRYPTION');

    if (isEncryptionSessionActive) {
      const key = this.env.get('SESSION_JWT_ENCRYPTION_KEY');
      finalAccessToken = await encryption.aes256gcm.decrypt(accessToken, key);
    } else {
      finalAccessToken = accessToken;
    }

    if (!finalAccessToken) {
      throw new ForbiddenException(ExceptionMessageCode.MISSING_TOKEN);
    }

    const accessTokenPayload = this.jwtService.getAccessTokenPayload(finalAccessToken);

    try {
      await this.jwtService.validateAccessToken(finalAccessToken, {
        platform: platform.getPlatform(),
        sub: accessTokenPayload.sub,
        userId: accessTokenPayload.userId,
      });

      const uuid = await this.userService.getUUIDById(accessTokenPayload.userId);

      //! adding extra property to socket handshake here
      socket.handshake.accessTokenPayload = accessTokenPayload;
      socket.handshake.user = { uuid };
    } catch (error) {
      // catch general token expired error, update is used if access token is correct and expired
      if (error instanceof TokenExpiredException) {
        throw new AccessTokenExpiredException();
      }

      throw error;
    }
  }

  private validateHeaders(socket: Socket) {
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
