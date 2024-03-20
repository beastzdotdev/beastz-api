import { $Enums, FileStructure } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FileStructureFromRaw implements FileStructure {
  @Expose()
  id: number;

  @Expose()
  path: string;

  @Expose()
  title: string;

  @Expose()
  color: string | null;

  @Expose()
  depth: number;

  @Expose({ name: 'user_id' })
  userId: number;

  @Expose({ name: 'size_in_bytes' })
  sizeInBytes: number | null;

  @Expose({ name: 'file_exstension_raw' })
  fileExstensionRaw: string | null;

  @Expose({ name: 'mime_type_raw' })
  mimeTypeRaw: string | null;

  @Expose({ name: 'mime_type' })
  mimeType: $Enums.FileMimeType | null;

  @Expose({ name: 'is_file' })
  isFile: boolean;

  @Expose({ name: 'is_shortcut' })
  isShortcut: boolean;

  @Expose({ name: 'is_in_bin' })
  isInBin: boolean;

  @Expose({ name: 'is_encrypted' })
  isEncrypted: boolean;

  @Expose({ name: 'is_editable' })
  isEditable: boolean | null;

  @Expose({ name: 'is_locked' })
  isLocked: boolean;

  @Expose({ name: 'last_modified_at' })
  lastModifiedAt: Date | null;

  @Expose({ name: 'created_at' })
  createdAt: Date;

  @Expose({ name: 'deleted_at' })
  deletedAt: Date | null;

  @Expose()
  uuid: string;

  @Expose({ name: 'root_parent_id' })
  rootParentId: number | null;

  @Expose({ name: 'parent_id' })
  parentId: number | null;

  @Expose()
  children: FileStructureFromRaw[] | null = [];
}
