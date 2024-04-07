import { IsInt, Min } from '@nestjs/class-validator';
import { Max } from 'class-validator';
import { TransformNumber } from '../../decorator/class-transformer.decorator';

export class PaginationRequestDto {
  @TransformNumber()
  @IsInt()
  @Min(1)
  page: number;

  @TransformNumber()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number;
}
