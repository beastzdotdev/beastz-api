import { Gender } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  userName: string;

  @Expose()
  birthDate: Date;

  @Expose()
  gender: Gender;

  @Expose()
  createdAt: Date;

  @Expose()
  profileImagePath: Date;
}
