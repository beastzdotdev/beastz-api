import { UserSupportMessage } from '@prisma/client';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserSupportImageResponseDto } from '../../user-support-image/dto/user-support-image-response.dto';

@Exclude()
export class UserSupportMessageResponseDto implements Partial<UserSupportMessage> {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  fromAdmin: boolean;

  @Expose()
  text: string;

  @Expose()
  userSupportId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => UserSupportImageResponseDto)
  userSupportImages: UserSupportImageResponseDto[] = [];
}
