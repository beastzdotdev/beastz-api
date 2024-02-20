/*
  Warnings:

  - Added the required column `uuid` to the `file_structure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file_structure" ADD COLUMN     "uuid" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "file_structure_uuid_idx" ON "file_structure"("uuid");
