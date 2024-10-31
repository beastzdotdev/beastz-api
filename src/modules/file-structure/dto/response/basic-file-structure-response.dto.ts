import path from 'path';
import { FileMimeType, FileStructure } from '@prisma/client';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { envService } from '@global/env';
import { FileStructureFromRaw } from '../../model/file-structure-from-raw';
import { constants } from '../../../../common/constants';
import { TransformFlags } from '../../../../model/types';

@Exclude()
export class BasicFileStructureResponseDto {
  @Expose()
  id: number;

  @Expose()
  path: string;

  @Expose()
  title: string;

  @Expose()
  depth: number;

  @Expose()
  color: string | null;

  @Expose()
  sizeInBytes: number | null;

  @Expose()
  fileExstensionRaw: string | null;

  @Expose()
  mimeTypeRaw: string | null;

  @Expose()
  mimeType: FileMimeType | null;

  @Expose()
  lastModifiedAt: Date | null;

  @Expose()
  isEditable: boolean | null;

  @Expose()
  isEncrypted: boolean | null;

  @Expose()
  isLocked: boolean | null;

  @Expose()
  isFile: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  rootParentId: number | null;

  @Expose()
  parentId: number | null;

  @Expose()
  sharedUniqueHash: string;

  @Expose()
  documentImagePreviewPath: string | null;

  @Expose()
  absRelativePath: string | null = null;

  @Expose()
  children: BasicFileStructureResponseDto[] | null; // do not use @Type decorator here

  private setAbsRelativePathContent(): void {
    const url = new URL(envService.get('BACKEND_URL'));
    url.pathname = path.join(constants.assets.userContentFolderName, this.path);

    this.absRelativePath = url.toString();
  }

  private setAbsRelativePathDocumentImagePreviewPath(): void {
    if (!this.documentImagePreviewPath) {
      return;
    }

    const url = new URL(envService.get('BACKEND_URL'));
    url.pathname = path.join(constants.assets.userUploadFolderName, this.documentImagePreviewPath);

    this.documentImagePreviewPath = url.toString();
  }

  setAbsRelativePathBin(binPath: string): void {
    const url = new URL(envService.get('BACKEND_URL'));
    url.pathname = path.join(constants.assets.userBinFolderName, binPath);

    this.absRelativePath = url.toString();
  }

  static map(data: FileStructure | FileStructureFromRaw, flags?: TransformFlags): BasicFileStructureResponseDto {
    const response = plainToInstance(BasicFileStructureResponseDto, data);

    if (!flags?.isInBin) {
      response.setAbsRelativePathContent();
    }

    response.setAbsRelativePathDocumentImagePreviewPath();

    if (data.isFile) {
      response.children = null;
    } else {
      response.children = [];

      if ('children' in data && data.children?.length) {
        response.children = data.children.map(e => this.map(e));
      }
    }

    return response;
  }

  static mapArr(data: FileStructure[] | FileStructureFromRaw[], flags?: TransformFlags) {
    return data.map((e: FileStructure | FileStructureFromRaw) => this.map(e), flags);
  }
}
