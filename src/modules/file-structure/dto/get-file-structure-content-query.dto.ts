import { IsNumber, IsOptional } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class GetFileStructureContentQueryDto {
  @IsOptional()
  @TransformNumber()
  @IsNumber()
  parentId?: number;
}
