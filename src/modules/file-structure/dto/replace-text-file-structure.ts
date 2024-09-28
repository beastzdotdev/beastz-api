import { IsBoolean, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReplaceTextFileStructure {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  text: string;

  @IsNotEmpty()
  @IsBoolean()
  checkEditMode?: boolean;
}
