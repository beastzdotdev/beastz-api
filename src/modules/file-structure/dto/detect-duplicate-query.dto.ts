import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class DetectDuplicateQueryDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  titles: string[];

  @IsNotEmpty()
  @IsBoolean()
  isFile: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;
}
