/*
  Warnings:

  - You are about to alter the column `size_in_bytes` on the `file_structure` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "file_structure" ALTER COLUMN "size_in_bytes" SET DATA TYPE INTEGER;
