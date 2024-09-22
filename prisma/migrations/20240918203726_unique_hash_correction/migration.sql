/*
  Warnings:

  - You are about to drop the column `unique_hash` on the `file_structure_public_share` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shared_unique_hash]` on the table `file_structure` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shared_unique_hash` to the `file_structure` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "file_structure_public_share_unique_hash_idx";

-- DropIndex
DROP INDEX "file_structure_public_share_unique_hash_key";

-- AlterTable
ALTER TABLE "file_structure" ADD COLUMN     "shared_unique_hash" VARCHAR(16) NOT NULL;

-- AlterTable
ALTER TABLE "file_structure_public_share" DROP COLUMN "unique_hash";

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_shared_unique_hash_key" ON "file_structure"("shared_unique_hash");

-- CreateIndex
CREATE INDEX "file_structure_shared_unique_hash_idx" ON "file_structure" USING HASH ("shared_unique_hash");
