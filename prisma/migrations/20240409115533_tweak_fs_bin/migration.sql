/*
  Warnings:

  - Added the required column `path` to the `file_structure_bin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file_structure_bin" ADD COLUMN     "path" TEXT NOT NULL;
