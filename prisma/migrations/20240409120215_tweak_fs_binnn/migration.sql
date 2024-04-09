/*
  Warnings:

  - Added the required column `name_uuid` to the `file_structure_bin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file_structure_bin" ADD COLUMN     "name_uuid" TEXT NOT NULL;
