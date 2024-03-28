import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class AuthConfirmQueryDto {
  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  token: string;
}
