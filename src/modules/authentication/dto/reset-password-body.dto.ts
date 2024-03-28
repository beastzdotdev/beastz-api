import { IsNotEmpty, IsString } from 'class-validator';
import { StrongPassword } from '../../../decorator/strong-password.decorator';

export class ResetPasswordBodyDto {
  @IsNotEmpty()
  @IsString()
  @StrongPassword()
  oldPassword: string;

  @IsNotEmpty()
  @IsString()
  @StrongPassword()
  newPassword: string;
}
