import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

export class GetDuplicateStatusQueryDto {
  @IsNotEmpty({ each: true })
  @IsArray()
  @Type(() => DuplChecker)
  items: DuplChecker[];

  @IsNotEmpty()
  @TransformBoolean()
  @IsBoolean()
  isFile: boolean;

  @IsOptional()
  @TransformNumber()
  @IsNumber()
  parentId?: number;
}

export class DuplChecker {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  mimeTypeRaw?: string;
}
