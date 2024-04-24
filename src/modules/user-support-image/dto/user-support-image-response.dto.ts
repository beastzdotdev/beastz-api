import { UserSupportImage } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserSupportImageResponseDto implements Partial<UserSupportImage> {
  @Expose()
  id: number;

  @Expose()
  path: string;

  @Expose()
  createdAt: Date;
}
