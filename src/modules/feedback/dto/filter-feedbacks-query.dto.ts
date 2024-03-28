import { IsOptional } from 'class-validator';
import { PageOptionsDto } from 'src/model/dto/page-options.dto';
import { FilterFeedbackParams } from '../feedback.type';
import { TransformNumber } from '../../../decorator/class-transformer.decorator';

export class FilterFeedbacksQueryDto extends PageOptionsDto implements FilterFeedbackParams {
  @IsOptional()
  @TransformNumber()
  userId?: number;
}
