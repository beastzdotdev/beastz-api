import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../@global/prisma/prisma.service';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { FileStructureFromRaw } from './model/file-structure-from-raw';

@Injectable()
export class FileStructureRawQueryRepository {
  private readonly logger = new Logger(FileStructureRawQueryRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  async recursiveSelect(
    params: {
      userId: number;
      parentId?: number | null;
      id?: number;
      depth?: number;
      inBin?: boolean;
      isFile?: boolean;
      inBinRootOnly?: boolean;
      inBinChildrenOnly?: boolean;
      notReturnRootItemId?: number;
      notIncludeRootId?: number;
    },
    tx?: PrismaTx,
  ): Promise<FileStructureFromRaw[]> {
    const db = tx ?? this.prismaService;

    const {
      id,
      userId,
      depth,
      parentId,
      inBin,
      isFile,
      inBinChildrenOnly,
      inBinRootOnly,
      notReturnRootItemId,
      notIncludeRootId,
    } = params;

    // if inBin is given then other two are not allowed
    if (
      (inBin !== undefined && inBinRootOnly !== undefined) ||
      (inBin !== undefined && inBinChildrenOnly !== undefined)
    ) {
      this.logger.debug('if inBin is given then other two are not allowed', {
        inBin,
        inBinChildrenOnly,
        inBinRootOnly,
      });

      throw new InternalServerErrorException('This should not happen');
    }

    let rootParentIdCheck: Prisma.Sql = Prisma.empty;
    let recursiveDepthCheck: Prisma.Sql = Prisma.empty;
    let idCheck: Prisma.Sql = Prisma.empty;
    let isFileCheck: Prisma.Sql = Prisma.empty;
    let isFileCheckRecursive: Prisma.Sql = Prisma.empty;
    let inBinCheck: Prisma.Sql = Prisma.empty;
    let inBinCheckRecursive: Prisma.Sql = Prisma.empty;
    let inBinRootOnlyCheck: Prisma.Sql = Prisma.empty;
    let inBinChildrenOnlyCheck: Prisma.Sql = Prisma.empty;
    let notIncludeRootIdCheck: Prisma.Sql = Prisma.empty;

    // only check for undefined not null
    // parentId null here means null check in db
    if (parentId !== undefined) {
      rootParentIdCheck =
        parentId === null ? Prisma.sql` and parent_id is null ` : Prisma.sql` and parent_id = ${parentId} `;
    }

    if (depth !== undefined) {
      recursiveDepthCheck = Prisma.sql` and fs.depth <= ${depth} `;
    }

    if (id !== undefined) {
      idCheck = Prisma.sql` and id = ${id} `;
    }

    if (isFile !== undefined) {
      isFileCheck = Prisma.sql` and is_file = ${isFile} `;
      isFileCheckRecursive = Prisma.sql` and fs.is_file = ${isFile} `;
    }

    if (inBin !== undefined) {
      inBinCheck = inBin ? Prisma.sql` and is_in_bin = true ` : Prisma.sql` and is_in_bin = false `;
      inBinCheckRecursive = inBin ? Prisma.sql` and fs.is_in_bin = true ` : Prisma.sql` and fs.is_in_bin = false `;
    }

    if (inBinRootOnly !== undefined) {
      inBinRootOnlyCheck = inBinRootOnly ? Prisma.sql` and is_in_bin = true ` : Prisma.sql` and is_in_bin = false `;
    }

    if (inBinChildrenOnly !== undefined) {
      inBinChildrenOnlyCheck = inBinChildrenOnly
        ? Prisma.sql` and fs.is_in_bin = true `
        : Prisma.sql` and fs.is_in_bin = false `;
    }

    if (notIncludeRootId !== undefined) {
      notIncludeRootIdCheck = Prisma.sql` and id != ${notIncludeRootId} `;
    }

    const finalSql = Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT *
        FROM file_structure
        WHERE user_id = ${userId}
        ${inBinCheck}
        ${inBinRootOnlyCheck}
        ${isFileCheck}
        ${rootParentIdCheck}
        ${idCheck}
        ${notIncludeRootIdCheck}

        UNION ALL

        SELECT fs.*
        FROM file_structure fs
            JOIN AllAncestors p ON fs.parent_id = p.id
        where fs.id <> p.id
        and fs.user_id = ${userId}
          ${inBinCheckRecursive}
          ${inBinChildrenOnlyCheck}
          ${recursiveDepthCheck}
          ${isFileCheckRecursive}
      )
      SELECT distinct * FROM AllAncestors;
    `;

    // console.log(finalSql.statement);
    // console.log(finalSql.values);

    let response = await db.$queryRaw<{ id: number & unknown }[]>(finalSql);

    if (notReturnRootItemId) {
      response = response.filter(e => e.id !== notReturnRootItemId);
    }

    return plainToInstance(FileStructureFromRaw, response, { exposeDefaultValues: true });
  }

  async recursiveDelete(id: number, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    const d = await db.$executeRaw(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT id, parent_id 
        FROM file_structure 
        WHERE id = ${id} and is_in_bin = false
    
        UNION ALL
    
        SELECT fs.id, fs.parent_id 
        FROM file_structure fs 
          JOIN AllAncestors p ON fs.parent_id = p.id
        WHERE fs.id <> p.id and is_in_bin = false
      )
        DELETE FROM file_structure WHERE id IN (SELECT id FROM AllAncestors);
    `);

    return d;
  }

  async recursiveUpdateIsInBin(id: number, isInBin: boolean, tx?: PrismaTx): Promise<number> {
    const db = tx ?? this.prismaService;

    const d = await db.$executeRaw(Prisma.sql`
      WITH RECURSIVE AllAncestors AS (
        SELECT id, parent_id
        FROM file_structure
        WHERE id = ${id} and is_in_bin = false

        UNION ALL

        SELECT fs.id, fs.parent_id
        FROM file_structure fs
          JOIN AllAncestors p ON fs.parent_id = p.id
        WHERE fs.id <> p.id and is_in_bin = false
      )
        UPDATE file_structure SET is_in_bin = ${isInBin} WHERE id IN (SELECT id FROM AllAncestors);
    `);

    return d;
  }
}
