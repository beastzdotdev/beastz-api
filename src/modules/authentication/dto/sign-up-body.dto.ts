import { Gender } from '@prisma/client';
import { IsDate, IsEnum, IsNotEmpty, IsString, MaxLength } from '@nestjs/class-validator';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';
import { StrongPassword } from '../../../decorator/strong-password.decorator';
import { TransformDate } from '../../../decorator/class-transformer.decorator';

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
  @TransformDate()
  @IsDate()
  birthDate: Date;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsString()
  @StrongPassword()
  password: string;
}
