export class AuthenticationPayloadResponseDto {
  accessToken: string;
  refreshToken: string;
  isAccountVerified?: boolean;
}
