/*
  Warnings:

  - Added the required column `cypher_iv` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "cypher_iv" TEXT NOT NULL;
