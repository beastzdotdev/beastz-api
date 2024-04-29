import { Gender, User } from '@prisma/client';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import path from 'path';
import { envService } from '../../@global/env/env.service';
import { constants } from '../../../common/constants';

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
  profileImagePath: string | null;

  @Expose()
  profileFullImagePath: string | null;

  static map(data: User): UserResponseDto {
    const response = plainToInstance(UserResponseDto, data);

    response.setAbsFullImgPath();

    return response;
  }

  setAbsFullImgPath() {
    if (this.profileImagePath) {
      const url = new URL(envService.get('BACKEND_URL'));
      url.pathname = path.join(constants.assets.userUploadFolderName, this.profileImagePath);
      this.profileFullImagePath = url.toString();
      return;
    }

    this.profileFullImagePath = null;
  }
}
