import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from 'src/model/dto/page-options.dto';
import { FilterFeedbackParams } from '../feedback.type';

export class FilterFeedbacksQueryDto extends PageOptionsDto implements FilterFeedbackParams {
  @IsOptional()
  @Type(() => Number)
  userId?: number;
}
