import { FileMimeType, FileStructurePublicShare } from '@prisma/client';
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

  setJoinLink(params: { sharedUniqueHash: string; title: string; mimeType: FileMimeType | null; fsId: number }): void {
    const { sharedUniqueHash, title, mimeType, fsId } = params;
    const url = new URL(envService.get('FRONTEND_DOCUMENT_URL'));

    url.pathname = constants.frontendPath.document.collabJoin;
    url.searchParams.set('sharedUniqueHash', sharedUniqueHash);

    const ext = mimeType === FileMimeType.TEXT_PLAIN ? '.txt' : '.md';
    url.searchParams.set('title', title + ext);

    url.searchParams.set('fsId', fsId.toString());

    this.joinLink = url.toString();
  }

  static map(
    data: FileStructurePublicShare,
    params: { sharedUniqueHash: string; title: string; mimeType: FileMimeType | null; fsId: number },
  ): FsPublicShareResponseDto {
    const response = plainToInstance(FsPublicShareResponseDto, data);
    response.setJoinLink(params);

    return response;
  }
}
