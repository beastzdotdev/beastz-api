/*
  Warnings:

  - You are about to drop the column `secret_key_encrypted` on the `refresh_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "secret_key_encrypted";
