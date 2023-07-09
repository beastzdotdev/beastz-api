/*
  Warnings:

  - The `uuid` column on the `recover_passwords` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `value` on the `refresh_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exp` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iat` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iss` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secret_key_encrypted` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sub` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "platform_for_jwt" AS ENUM ('WEB', 'MOB_IOS', 'MOB_ANDROID');

-- DropIndex
DROP INDEX "refresh_tokens_value_idx";

-- AlterTable
ALTER TABLE "recover_passwords" DROP COLUMN "uuid",
ADD COLUMN     "uuid" UUID;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "value",
ADD COLUMN     "exp" TEXT NOT NULL,
ADD COLUMN     "iat" TEXT NOT NULL,
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iss" TEXT NOT NULL,
ADD COLUMN     "jti" UUID NOT NULL,
ADD COLUMN     "platform" "platform_for_jwt" NOT NULL,
ADD COLUMN     "secret_key_encrypted" VARCHAR(255) NOT NULL,
ADD COLUMN     "sub" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_uuid_key" ON "recover_passwords"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");
