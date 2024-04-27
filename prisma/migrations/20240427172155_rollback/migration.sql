/*
  Warnings:

  - You are about to drop the column `password` on the `file_structure_encryption` table. All the data in the column will be lost.
  - You are about to drop the column `pin` on the `file_structure_encryption` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "file_structure_encryption" DROP COLUMN "password",
DROP COLUMN "pin";
