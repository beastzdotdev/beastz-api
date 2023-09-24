/*
  Warnings:

  - You are about to drop the column `new_password` on the `account_verifications` table. All the data in the column will be lost.
  - Added the required column `new_password` to the `recover_passwords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_verifications" DROP COLUMN "new_password";

-- AlterTable
ALTER TABLE "recover_passwords" ADD COLUMN     "new_password" VARCHAR(255) NOT NULL;
