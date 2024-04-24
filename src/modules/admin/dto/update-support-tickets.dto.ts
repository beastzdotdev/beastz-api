import { UserSupport, UserSupportTicketStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class UpdateSupportTicketDto implements Partial<UserSupport> {
  @IsOptional()
  @IsEnum(UserSupportTicketStatus)
  status?: UserSupportTicketStatus;

  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
