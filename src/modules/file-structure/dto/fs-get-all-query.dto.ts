import { ArrayMinSize, IsArray, IsEnum, IsOptional } from 'class-validator';
import { FileMimeType, Prisma } from '@prisma/client';
import { TransformBoolean } from '../../../decorator/class-transformer.decorator';
import { enumMessage } from '../../../common/helper';

export class FsGetAllQueryDto {
  @IsOptional()
  @TransformBoolean()
  isFile?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(FileMimeType, { each: true, message: enumMessage('fileTypes', FileMimeType) })
  fileTypes?: FileMimeType[];

  @IsOptional()
  @IsEnum(Prisma.SortOrder, { message: enumMessage('orderByLastModifiedAt', Prisma.SortOrder) })
  orderByLastModifiedAt?: Prisma.SortOrder;
}
