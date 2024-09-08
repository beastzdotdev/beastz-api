import { IsOptional } from 'class-validator';
import { FilterFeedbackParams } from '../feedback.type';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';
import { PaginationRequestDto } from '../../../model/dto/pagination-request.dto';

export class FilterFeedbacksQueryDto extends PaginationRequestDto implements FilterFeedbackParams {
  @IsOptional()
  @TransformNumber()
  userId?: number;
}
