import { IsInt, IsNotEmpty } from 'class-validator';

export class FsPublicShareCreateOrIgnoreDto {
  @IsNotEmpty()
  @IsInt()
  fileStructureId: number;
}
