import { UserSupportMessage } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

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
}
