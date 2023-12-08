import { IsNotEmpty } from 'class-validator';
import { IsMulterFile } from '../../../decorator/class-validator.decorator';
import { constants } from '../../../common/constants';

export class CreateFileStructureDto {
  @IsNotEmpty()
  @IsMulterFile({
    maxSize: constants.singleFileMaxSize,
    fileTypes: Object.values(constants.fileTypeEnumToRawMime),
  })
  file: Express.Multer.File;
}
