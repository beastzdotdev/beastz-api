import { UserSupportMessage } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserSupportMessageCreateDto implements Partial<UserSupportMessage> {
  @IsNotEmpty()
  file: Express.Multer.File;

  @IsNotEmpty()
  @IsString()
  text: string;
}
