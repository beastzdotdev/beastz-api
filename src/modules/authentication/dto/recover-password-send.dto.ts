import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';

export class RecoverPasswordSendDto {
  @IsNotEmpty()
  @IsString()
  @IsEmailCustom()
  @MaxLength(255)
  email: string;
}
