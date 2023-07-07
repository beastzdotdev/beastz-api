import { IsNotEmpty, IsNumber } from 'class-validator';
import { IsEmailCustom } from '../../../decorator/class-validator.decorator';

export class RecoverPasswordConfirmCodeBodyDto {
  @IsNotEmpty()
  @IsNumber()
  code: number;

  @IsNotEmpty()
  @IsEmailCustom()
  email: string;
}
