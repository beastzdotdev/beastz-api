import { IsOptional } from 'class-validator';
import { TransformBoolean } from '../../../decorator/class-transformer.decorator';

export class FsGetAllQueryDto {
  @IsOptional()
  @TransformBoolean()
  isFile?: boolean;
}
