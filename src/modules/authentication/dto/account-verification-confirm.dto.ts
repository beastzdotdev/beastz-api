import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AccountVerificationConfirmQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  token: string;
}
