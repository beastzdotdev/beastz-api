import { IsString, MaxLength } from '@nestjs/class-validator';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';
import { StrongPassword } from '../../../decorator/strong-password.decorator';

export class SignInBodyDto {
  @IsString()
  @IsEmailCustom()
  @MaxLength(255)
  email: string;

  @IsString()
  @StrongPassword()
  password: string;
}
