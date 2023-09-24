import { PlatformForJwt } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RecoverPasswordDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  recoverPasswordId: number;

  @IsNotEmpty()
  @IsString()
  securityToken: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsEnum(PlatformForJwt)
  platform: PlatformForJwt;
}
