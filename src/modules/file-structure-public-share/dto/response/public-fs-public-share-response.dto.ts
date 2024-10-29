import { Expose, Exclude, Type } from 'class-transformer';
import { FileStructurePublicShare } from '@prisma/client';
import { BasicFileStructureResponseDto } from '../../../file-structure/dto/response/basic-file-structure-response.dto';

@Exclude()
export class PublicFsPublicShareResponseDto implements Partial<FileStructurePublicShare> {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  fileStructureId: number;

  @Expose()
  isDisabled: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => BasicFileStructureResponseDto)
  fileStructure: BasicFileStructureResponseDto;
}
