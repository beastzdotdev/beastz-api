import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';

export class AccountVerificationConfirmCodeDto {
  @IsNotEmpty()
  @IsString()
  @IsEmailCustom()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsNumber()
  code: number;
}
