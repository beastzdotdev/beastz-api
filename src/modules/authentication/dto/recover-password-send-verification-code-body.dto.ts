import { IsNotEmpty, IsString } from 'class-validator';

export class RecoverPasswordSendVerificationCodeBodyDto {
  @IsNotEmpty()
  @IsString()
  email: string;
}
