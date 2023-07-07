import { IsNotEmpty, IsNumber } from 'class-validator';
import { IsEmailCustom } from 'src/decorator/validation/is-email.decorator';

export class RecoverPasswordConfirmCodeBodyDto {
  @IsNotEmpty()
  @IsNumber()
  code: number;

  @IsNotEmpty()
  @IsEmailCustom()
  email: string;
}
