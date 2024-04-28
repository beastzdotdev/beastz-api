import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReplaceTextFileStructure {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  text: string;
}
