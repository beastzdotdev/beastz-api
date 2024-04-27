import { IsNotEmpty, IsNumber } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class UploadEncryptedFileStructureDto {
  @IsNotEmpty()
  encryptedFile: Express.Multer.File;

  @IsNotEmpty()
  @IsNumber()
  @TransformNumber()
  fileStructureId: number;
}
