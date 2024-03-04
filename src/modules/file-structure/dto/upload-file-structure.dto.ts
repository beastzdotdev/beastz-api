import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { IsMulterFile } from '../../../decorator/class-validator.decorator';
import { constants } from '../../../common/constants';
import { fileStructureHelper } from '../file-structure.helper';

/**
 * Custom validation: dto will only containt both parentId and rootParentId or none also
 *                    if replaceExisting does not exist than for duplicate file/folder names
 *                    will have thair file name changed or rather incremented
 */
export class UploadFileStructureDto {
  @IsNotEmpty()
  @IsMulterFile({
    fileTypes: Object.values(fileStructureHelper.fileTypeEnumToRawMime),
    maxSize: constants.singleFileMaxSize,
  })
  file: Express.Multer.File;

  @IsOptional()
  @IsDate()
  lastModifiedAt?: Date;

  @IsOptional()
  @IsBoolean()
  keepBoth?: boolean; // increase file number in title

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  rootParentId?: number;
}
