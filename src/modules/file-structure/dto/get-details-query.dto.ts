import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

export class GetDetailsQueryDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  @TransformNumber()
  @ArrayMinSize(1)
  ids: number[];

  @IsOptional()
  @TransformBoolean()
  isInBin?: boolean;
}
