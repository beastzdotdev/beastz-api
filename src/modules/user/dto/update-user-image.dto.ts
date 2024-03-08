import { IsNotEmpty } from '@nestjs/class-validator';

export class UpdateUserProfileImageDto {
  @IsNotEmpty()
  profileImageFile: Express.Multer.File;
}
