export class AuthenticationPayloadResponseDto {
  accessToken: string;
  refreshToken: string;
  hasEmailVerified?: boolean;
}
