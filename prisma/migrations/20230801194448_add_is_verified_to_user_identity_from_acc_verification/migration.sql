/*
  Warnings:

  - You are about to drop the column `is_verified` on the `account_verification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "account_verification" DROP COLUMN "is_verified";

-- AlterTable
ALTER TABLE "user_identity" ADD COLUMN     "is_account_verified" BOOLEAN NOT NULL DEFAULT false;
