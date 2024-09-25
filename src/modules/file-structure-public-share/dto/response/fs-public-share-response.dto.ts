import { FileStructurePublicShare } from '@prisma/client';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { envService } from '@global/env';
import { constants } from '../../../../common/constants';

@Exclude()
export class FsPublicShareResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  fileStructureId: number;

  @Expose()
  isDownloadable: boolean;

  @Expose()
  isPasswordProtected: boolean;

  @Expose()
  isDisabled: boolean;

  @Expose()
  expiresAt: Date | null;

  @Expose()
  password: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  joinLink: string;

  setJoinLink() {
    const url = new URL(envService.get('FRONTEND_DOCUMENT_URL'));
    url.pathname = constants.frontendPath.document.collabJoin;
    //TODO fix here uniqueHash is from fs not from public share anymore
    // url.searchParams.set('uniqueHash', this.uniqueHash);

    this.joinLink = url.toString();
  }

  static map(data: FileStructurePublicShare): FsPublicShareResponseDto {
    const response = plainToInstance(FsPublicShareResponseDto, data);
    response.setJoinLink();

    return response;
  }
}
