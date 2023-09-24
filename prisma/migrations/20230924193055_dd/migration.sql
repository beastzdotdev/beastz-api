/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `account_verifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[jti]` on the table `recover_passwords` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `account_verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `recover_passwords` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "account_verifications" ADD COLUMN     "jti" UUID NOT NULL;

-- AlterTable
ALTER TABLE "recover_passwords" ADD COLUMN     "jti" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "account_verifications_jti_key" ON "account_verifications"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_jti_key" ON "recover_passwords"("jti");
