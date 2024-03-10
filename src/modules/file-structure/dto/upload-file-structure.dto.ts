import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { TransformBoolean, TransformDate, TransformNumber } from '../../../decorator/class-transformer.decorator';

/**
 * Custom validation: dto will only containt both parentId and rootParentId or none also
 *                    if replaceExisting does not exist than for duplicate file/folder names
 *                    will have thair file name changed or rather incremented
 */
export class UploadFileStructureDto {
  @IsNotEmpty()
  file: Express.Multer.File;

  @IsOptional()
  @TransformDate()
  @IsDate()
  lastModifiedAt?: Date;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  keepBoth?: boolean; // increase file number in title

  @IsOptional()
  @TransformNumber()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @TransformNumber()
  @IsInt()
  rootParentId?: number;
}
