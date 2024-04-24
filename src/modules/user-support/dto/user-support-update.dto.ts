import { UserSupport, UserSupportTicketStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { enumMessage } from '../../../common/helper';

export class UserSupportUpdateDto implements Partial<UserSupport> {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(UserSupportTicketStatus, { message: enumMessage('status', UserSupportTicketStatus) })
  @IsIn([UserSupportTicketStatus.IGNORED, UserSupportTicketStatus.RESOLVED])
  status?: UserSupportTicketStatus;
}
