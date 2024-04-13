import { IsNotEmpty, IsNumber } from 'class-validator';
import { IsNullable } from '../../../decorator/is-nullable.decorator';

export class RestoreFromBinDto {
  @IsNullable()
  @IsNotEmpty()
  @IsNumber()
  newParentId: number | null;
}
