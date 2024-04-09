import { IsNumber, IsOptional } from 'class-validator';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';
import { PaginationRequestDto } from '../../../model/dto/pagination-request.dto';

export class GetFromBinQueryDto extends PaginationRequestDto {
  @IsOptional()
  @TransformNumber()
  @IsNumber()
  parentId?: number;
}
