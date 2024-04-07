import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFolderStructureDto {
  @IsOptional()
  @IsBoolean()
  isInBin?: boolean;
}
