import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RecoverPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID('4')
  uuid: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
