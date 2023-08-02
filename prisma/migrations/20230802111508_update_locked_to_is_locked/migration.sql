/*
  Warnings:

  - You are about to drop the column `locked` on the `user_identity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_identity" DROP COLUMN "locked",
ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false;
