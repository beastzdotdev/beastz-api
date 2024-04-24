import { UserSupport } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserSupportCreateDto implements Partial<UserSupport> {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  title: string;
}
