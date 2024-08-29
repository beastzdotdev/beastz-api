import { IsInt, IsOptional, Length } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class FsPublishShareGetByQueryDto {
  @IsOptional()
  @Length(16, 16)
  uniqueHash?: string;

  @IsOptional()
  @TransformNumber()
  @IsInt()
  fileStructureId?: number;
}
