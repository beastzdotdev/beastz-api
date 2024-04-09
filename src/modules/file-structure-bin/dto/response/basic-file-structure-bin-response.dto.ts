import { Exclude, Expose, Type } from 'class-transformer';
import { BasicFileStructureResponseDto } from '../../../file-structure/dto/response/basic-file-structure-response.dto';

@Exclude()
export class BasicFileStructureBinResponseDto {
  @Expose()
  id: number;

  @Expose()
  path: string;

  @Expose()
  userId: number;

  @Expose()
  nameUUID: string;

  @Expose()
  fileStructureId: number;

  @Expose()
  @Type(() => BasicFileStructureResponseDto)
  fileStructure: BasicFileStructureResponseDto;

  @Expose()
  createdAt: Date;
}
