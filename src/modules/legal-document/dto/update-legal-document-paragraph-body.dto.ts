import { IsNotEmpty, IsOptional } from '@nestjs/class-validator';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class UpdateLegalDocumentParagraphBodyDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  index?: number;
}
