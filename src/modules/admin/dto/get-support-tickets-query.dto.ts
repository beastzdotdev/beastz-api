import { UserSupportTicketStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

export class GetSupportTicketsQueryDto {
  @IsOptional()
  @IsNumber()
  @TransformNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  @TransformNumber()
  userId: number;

  @IsOptional()
  @IsEnum(UserSupportTicketStatus)
  status?: UserSupportTicketStatus;

  @IsOptional()
  @IsBoolean()
  @TransformBoolean()
  getMessages?: boolean;

  @IsOptional()
  title?: string;

  @IsOptional()
  uuid?: string;
}
