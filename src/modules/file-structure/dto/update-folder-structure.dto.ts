import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class UpdateFolderStructureDto {
  @IsOptional()
  @IsString()
  @IsHexColor()
  color?: string;
}
