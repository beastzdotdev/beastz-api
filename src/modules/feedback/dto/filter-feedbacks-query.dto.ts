import { IsOptional } from 'class-validator';
import { PaginationRequestDto } from 'src/model/dto/pagination-request.dto';
import { FilterFeedbackParams } from '../feedback.type';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class FilterFeedbacksQueryDto extends PaginationRequestDto implements FilterFeedbackParams {
  @IsOptional()
  @TransformNumber()
  userId?: number;
}
