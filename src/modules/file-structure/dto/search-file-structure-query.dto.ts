import { IsNotEmpty, MinLength } from 'class-validator';

export class SearchFileStructureQueryDto {
  @IsNotEmpty()
  @MinLength(1)
  search: string;
}
