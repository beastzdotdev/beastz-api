import { IsNotEmpty, IsNumber } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class UploadEncryptedFileStructureDto {
  @IsNotEmpty()
  file: Express.Multer.File;

  @IsNotEmpty()
  @IsNumber()
  @TransformNumber()
  fileStructureId: number;
}
