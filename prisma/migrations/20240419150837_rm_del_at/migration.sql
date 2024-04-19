/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `file_structure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "file_structure" DROP COLUMN "deleted_at";
