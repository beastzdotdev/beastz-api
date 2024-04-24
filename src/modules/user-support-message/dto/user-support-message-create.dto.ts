import { UserSupportMessage } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UserSupportMessageCreateDto implements Partial<UserSupportMessage> {
  @IsOptional()
  file?: Express.Multer.File;

  @IsNotEmpty()
  @IsString()
  text: string;
}
