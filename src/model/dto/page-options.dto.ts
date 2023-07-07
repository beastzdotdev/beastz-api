import { IsInt, Min } from '@nestjs/class-validator';
import { Type } from 'class-transformer';
import { Max } from 'class-validator';

export class PageOptionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize: number;
}
