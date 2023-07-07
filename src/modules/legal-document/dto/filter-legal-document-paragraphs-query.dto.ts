import { IsString, IsNotEmpty, IsOptional } from '@nestjs/class-validator';
import { MaxLength } from 'class-validator';

export class FilterLegalDocumentParagraphsQueryDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  searchQuery?: string;
}
