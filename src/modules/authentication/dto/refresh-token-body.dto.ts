import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class RefreshTokenBodyDto {
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
