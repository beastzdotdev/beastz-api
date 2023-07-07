import { IsString, MaxLength, MinLength } from '@nestjs/class-validator';
import { IsEmailCustom } from '../../../decorator/validation/is-email.decorator';

export class SignInBodyDto {
  @IsString()
  @IsEmailCustom()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
