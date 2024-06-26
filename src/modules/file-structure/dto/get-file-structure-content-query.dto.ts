import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

/**
 * @description Here focus parent id focuses deeply nested file structure and
 * replaces intial content root with its own root but instead of depth 2
 * it has depth more than 2
 */
export class GetFileStructureContentQueryDto {
  @IsOptional()
  @TransformNumber()
  @IsNumber()
  parentId?: number;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  isFile?: boolean;
}
