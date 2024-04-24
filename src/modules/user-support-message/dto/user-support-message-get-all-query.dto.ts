import { IsNumber, IsNotEmpty } from 'class-validator';
import { UserSupportMessage } from '@prisma/client';
import { PaginationRequestDto } from '../../../model/dto/pagination-request.dto';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class UserSupportMessageQueryAllDto extends PaginationRequestDto implements Partial<UserSupportMessage> {
  @IsNotEmpty()
  @IsNumber()
  @TransformNumber()
  userSupportId: number;
}
