import { IsDate, IsEnum, IsNotEmpty, IsString, MaxLength } from '@nestjs/class-validator';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class UpdateUserDetailsDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  userName?: string;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(Gender)
  gender?: Gender;
}
