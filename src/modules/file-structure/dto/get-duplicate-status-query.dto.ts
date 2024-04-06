import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

export class GetDuplicateStatusQueryDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  titles: string[];

  @IsNotEmpty()
  @TransformBoolean()
  @IsBoolean()
  isFile: boolean;

  @IsOptional()
  @TransformNumber()
  @IsNumber()
  parentId?: number;
}
