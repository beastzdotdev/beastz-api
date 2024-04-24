import { UserSupportTicketStatus } from '@prisma/client';
import { IsOptional, IsEnum } from 'class-validator';
import { PaginationRequestDto } from '../../../model/dto/pagination-request.dto';
import { enumMessage } from '../../../common/helper';

export class UserSupportQueryAllDto extends PaginationRequestDto {
  @IsOptional()
  @IsEnum(UserSupportTicketStatus, { message: enumMessage('status', UserSupportTicketStatus) })
  status: UserSupportTicketStatus;
}
