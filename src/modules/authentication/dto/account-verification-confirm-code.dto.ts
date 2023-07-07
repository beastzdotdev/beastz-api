import { IsNotEmpty, IsNumber } from 'class-validator';

export class AccountVerificationConfirmCodeDto {
  @IsNotEmpty()
  @IsNumber()
  code: number;
}
