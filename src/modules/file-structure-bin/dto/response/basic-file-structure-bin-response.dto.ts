import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { BasicFileStructureResponseDto } from '../../../file-structure/dto/response/basic-file-structure-response.dto';
import { FileStructureBinWithRelation } from '../../file-structure-bin.type';

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
  fileStructure: BasicFileStructureResponseDto; // do not user @Type here

  @Expose()
  createdAt: Date;

  static mapArr(data: FileStructureBinWithRelation[]): BasicFileStructureBinResponseDto[] {
    return data.map(e => this.map(e));
  }

  static map(data: FileStructureBinWithRelation): BasicFileStructureBinResponseDto {
    const response = plainToInstance(BasicFileStructureBinResponseDto, data);

    response.fileStructure = plainToInstance(BasicFileStructureResponseDto, data.fileStructure);
    response.fileStructure.setAbsRelativePathBin(data.path);

    return response;
  }
}
