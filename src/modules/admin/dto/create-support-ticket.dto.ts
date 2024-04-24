import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateSupportTicketsDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  supportId: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  message: string;
}
