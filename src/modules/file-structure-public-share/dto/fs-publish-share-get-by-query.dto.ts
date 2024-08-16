import { IsOptional, Length } from 'class-validator';

export class FsPublishShareGetByQueryDto {
  @IsOptional()
  @Length(16, 16)
  uniqueHash: string;
}
