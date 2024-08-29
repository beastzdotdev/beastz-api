import { IsBoolean, IsOptional } from 'class-validator';

export class FsPublicShareUpdateByIdDto {
  @IsOptional()
  @IsBoolean()
  isDisabled?: boolean;
}
