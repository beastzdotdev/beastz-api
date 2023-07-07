import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DataPageResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  total: number;
}
