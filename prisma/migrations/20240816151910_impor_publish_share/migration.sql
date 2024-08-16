/*
  Warnings:

  - You are about to alter the column `unique_hash` on the `file_structure_public_share` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - A unique constraint covering the columns `[unique_hash]` on the table `file_structure_public_share` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "file_structure_public_share" ALTER COLUMN "unique_hash" SET DATA TYPE VARCHAR(16);

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_public_share_unique_hash_key" ON "file_structure_public_share"("unique_hash");

-- CreateIndex
CREATE INDEX "file_structure_public_share_unique_hash_idx" ON "file_structure_public_share" USING HASH ("unique_hash");
