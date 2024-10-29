import { Review } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { enumMessage } from '../../../common/helper';

export class FeedbackCreateDto {
  @IsNotEmpty()
  @IsEnum(Review, { message: enumMessage('review', Review) })
  review: Review;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  images?: Express.Multer.File[];
}
