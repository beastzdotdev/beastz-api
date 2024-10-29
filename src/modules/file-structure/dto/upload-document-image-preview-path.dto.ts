import { IsNotEmpty } from 'class-validator';

export class UploadDocumentImagePreviewPathDto {
  @IsNotEmpty()
  img: Express.Multer.File;
}
