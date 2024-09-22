import { IsInt, IsOptional } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class FsPublishShareGetByQueryDto {
  @IsOptional()
  @TransformNumber()
  @IsInt()
  fileStructureId?: number;
}
