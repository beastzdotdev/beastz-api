import { UserSupport, UserSupportTicketStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserSupportResponseDto implements Partial<UserSupport> {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  status: UserSupportTicketStatus;

  @Expose()
  description: string;

  @Expose()
  userId: number;

  @Expose()
  uuid: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
