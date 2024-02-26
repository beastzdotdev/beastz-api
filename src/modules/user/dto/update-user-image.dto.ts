import { IsNotEmpty } from '@nestjs/class-validator';
import { constants } from '../../../common/constants';
import { IsMulterFile } from '../../../decorator/class-validator.decorator';
import { fileStructureHelper } from '../../file-structure/file-structure.helper';

export class UpdateUserProfileImageDto {
  @IsNotEmpty()
  @IsMulterFile({
    fileTypes: Object.values([
      fileStructureHelper.fileTypeEnumToRawMime.IMAGE_JPG,
      fileStructureHelper.fileTypeEnumToRawMime.IMAGE_PNG,
      fileStructureHelper.fileTypeEnumToRawMime.IMAGE_WEBP,
      fileStructureHelper.fileTypeEnumToRawMime.IMAGE_BMP,
    ]),
    maxSize: constants.singleFileMaxSize,
  })
  profileImageFile: Express.Multer.File;
}
