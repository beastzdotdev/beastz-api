import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetDuplicateStatusDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  @Type(() => DuplChecker)
  items: DuplChecker[];

  @IsNotEmpty()
  @IsBoolean()
  isFile: boolean;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}

export class DuplChecker {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  mimeTypeRaw?: string;
}
