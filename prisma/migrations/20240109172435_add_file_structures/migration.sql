/*
  Warnings:

  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_name]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `is_encrypted` to the `file_structure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_in_bin` to the `file_structure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_locked` to the `file_structure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_shortcut` to the `file_structure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `file_structure` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "encryption_type" AS ENUM ('TEXT', 'PIN');

-- CreateEnum
CREATE TYPE "encryption_algorithm" AS ENUM ('AES_256_GCM');

-- AlterEnum
ALTER TYPE "file_mime_type" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "file_structure" ADD COLUMN     "color" VARCHAR(9),
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "file_exstension_raw" TEXT,
ADD COLUMN     "is_editable" BOOLEAN,
ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL,
ADD COLUMN     "is_in_bin" BOOLEAN NOT NULL,
ADD COLUMN     "is_locked" BOOLEAN NOT NULL,
ADD COLUMN     "is_shortcut" BOOLEAN NOT NULL,
ADD COLUMN     "last_modified_at" TIMESTAMPTZ,
ADD COLUMN     "root_parent_id" INTEGER,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ALTER COLUMN "birth_date" DROP NOT NULL;

-- CreateTable
CREATE TABLE "file_structure_encryption" (
    "id" SERIAL NOT NULL,
    "type" "encryption_type" NOT NULL,
    "algorithm" "encryption_algorithm" NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_encryption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_bookmark" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_share" (
    "id" SERIAL NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_share_public_link" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "unique_hash" TEXT NOT NULL,
    "is_downloadable" BOOLEAN NOT NULL DEFAULT false,
    "is_restricted_to_only_users" BOOLEAN NOT NULL DEFAULT false,
    "is_password_protected" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT,
    "custom_title" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_share_public_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_share_public_link_user" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_share_public_link_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_share_public_link_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_encryption_file_structure_id_key" ON "file_structure_encryption"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_share_file_structure_id_key" ON "file_structure_share"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_share_public_link_file_structure_id_key" ON "file_structure_share_public_link"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- AddForeignKey
ALTER TABLE "file_structure" ADD CONSTRAINT "file_structure_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_encryption" ADD CONSTRAINT "file_structure_encryption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_encryption" ADD CONSTRAINT "file_structure_encryption_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bookmark" ADD CONSTRAINT "file_structure_bookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bookmark" ADD CONSTRAINT "file_structure_bookmark_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share_public_link" ADD CONSTRAINT "file_structure_share_public_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share_public_link" ADD CONSTRAINT "file_structure_share_public_link_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share_public_link_user" ADD CONSTRAINT "file_structure_share_public_link_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share_public_link_user" ADD CONSTRAINT "file_structure_share_public_link_user_file_structure_share_fkey" FOREIGN KEY ("file_structure_share_public_link_id") REFERENCES "file_structure_share_public_link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
