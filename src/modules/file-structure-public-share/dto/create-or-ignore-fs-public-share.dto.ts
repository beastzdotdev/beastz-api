import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateOrIgnoreFsPublicShareDto {
  @IsNotEmpty()
  @IsInt()
  fileStructureId: number;
}
