import { Gender } from '@prisma/client';
import { IsDate, IsEnum, IsNotEmpty, IsString, MaxLength } from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';
import { StrongPassword } from '../../../decorator/strong-password.decorator';

export class SignUpBodyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  userName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lastName: string;

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
  @StrongPassword()
  password: string;

  @IsNotEmpty()
  @IsString()
  profileImagePath: string;
}
