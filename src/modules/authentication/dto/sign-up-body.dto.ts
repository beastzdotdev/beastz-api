import { IsDate, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from '@nestjs/class-validator';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmailCustom } from '../../../decorator/validation/is-email.decorator';

export class SignUpBodyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  userName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmailCustom()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  birthDate: Date;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
