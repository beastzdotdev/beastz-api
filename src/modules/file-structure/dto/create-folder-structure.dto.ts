import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Custom validation: dto will only containt both parentId and rootParentId or none also
 *                    if replaceExisting does not exist than for duplicate file/folder names
 *                    will have thair file name changed or rather incremented
 */
export class CreateFolderStructureDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  keepBoth?: boolean;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsInt()
  rootParentId?: number;
}
