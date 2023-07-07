import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DataPageResponseDto<T> {
  @Expose()
  readonly data: T[];

  @Expose()
  readonly total: number;
}
