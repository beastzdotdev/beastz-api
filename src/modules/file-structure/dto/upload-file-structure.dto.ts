import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Custom validation: dto will only containt both parentId and rootParentId or none also
 *                    if replaceExisting does not exist than for duplicate file/folder names
 *                    will have thair file name changed or rather incremented
 */
export class UploadFileStructureDto {
  @IsNotEmpty()
  file: Express.Multer.File;

  @IsOptional()
  @IsDate()
  lastModifiedAt?: Date;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  keepBoth?: boolean; // increase file number in title

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  rootParentId?: number;
}
