import { PlatformForJwt } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AccountVerificationConfirmCodeQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(PlatformForJwt)
  platform: PlatformForJwt;
}
