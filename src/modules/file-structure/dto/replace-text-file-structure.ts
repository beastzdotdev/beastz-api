import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ReplaceTextFileStructure {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @IsBoolean()
  checkEditMode?: boolean;
}
