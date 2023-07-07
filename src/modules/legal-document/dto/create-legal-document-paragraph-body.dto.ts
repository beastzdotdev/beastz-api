import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from '@nestjs/class-validator';

export class CreateLegalDocumentParagraphBodyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  index: number;
}
