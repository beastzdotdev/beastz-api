import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SendSimpleParams } from '../../@global/mail/mail.type';

export class SendMailDto implements SendSimpleParams {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject: string;

  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(500, { each: true })
  @IsArray()
  to: string[];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text: string;
}
