// async recursiveSelectCountCheck(
//   params: {
//     userId: number;
//     id?: number;
//     inBin?: boolean;
//   },
//   tx?: PrismaTx,
// ): Promise<number> {
//   const db = tx ?? this.prismaService;

//   const { id, userId, inBin } = params;

//   let idCheck: Prisma.Sql = Prisma.empty;
//   let inBinCheck: Prisma.Sql = Prisma.empty;
//   let inBinCheckRecursive: Prisma.Sql = Prisma.empty;

//   if (id !== undefined) {
//     idCheck = Prisma.sql` and id = ${id} `;
//   }

//   if (inBin !== undefined) {
//     inBinCheck = inBin ? Prisma.sql` and is_in_bin = true ` : Prisma.sql` and is_in_bin = false `;
//     inBinCheckRecursive = inBin ? Prisma.sql` and fs.is_in_bin = true ` : Prisma.sql` and fs.is_in_bin = false `;
//   }

//   const finalSql = Prisma.sql`
//     WITH RECURSIVE AllAncestors AS (
//       SELECT id
//       FROM file_structure
//       WHERE user_id = ${userId}
//       ${inBinCheck}
//       ${idCheck}

//       UNION ALL

//       SELECT fs.id
//       FROM file_structure fs
//           JOIN AllAncestors p ON fs.parent_id = p.id
//       where fs.id <> p.id
//       and fs.user_id = ${userId}
//         ${inBinCheckRecursive}
//     )
//     SELECT COUNT(*)::INT AS count FROM AllAncestors;
//   `;

//   const response = await db.$queryRaw<{ count: number }[]>(finalSql);

//   return response?.[0]?.count ?? 0;
// }
