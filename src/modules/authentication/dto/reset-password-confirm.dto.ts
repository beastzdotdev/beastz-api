import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ResetPasswordVerifyQueryDto {
  @IsNotEmpty()
  @Transform(({ value }) => Number.parseInt(value))
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  token: string;
}
