import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { IsMulterFile } from '../../../decorator/class-validator.decorator';
import { constants } from '../../../common/constants';
import { fileStructureHelper } from '../file-structure.helper';

/**
 * Custom validation: dto will only containt both parentId and rootParentId or none
 */
export class UploadFileStructureDto {
  @IsNotEmpty()
  @IsMulterFile({
    maxSize: constants.singleFileMaxSize,
    fileTypes: Object.values(fileStructureHelper.fileTypeEnumToRawMime),
  })
  file: Express.Multer.File;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  rootParentId?: number;
}
