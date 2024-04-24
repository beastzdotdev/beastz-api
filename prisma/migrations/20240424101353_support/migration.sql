/*
  Warnings:

  - Changed the type of `name_uuid` on the `file_structure_bin` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "user_support_ticket_status" AS ENUM ('RESOLVED', 'PENDING', 'IGNORED');

-- AlterTable
ALTER TABLE "file_structure_bin" DROP COLUMN "name_uuid",
ADD COLUMN     "name_uuid" UUID NOT NULL;

-- CreateTable
CREATE TABLE "user_support" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "uuid" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "user_support_ticket_status" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support_messages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "from_admin" BOOLEAN NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_support_id" INTEGER NOT NULL,

    CONSTRAINT "user_support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support_images" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_support_message_id" INTEGER NOT NULL,
    "user_support_id" INTEGER NOT NULL,
    "name_uuid" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_support_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_support_uuid_idx" ON "user_support"("uuid");

-- CreateIndex
CREATE INDEX "user_support_images_name_uuid_idx" ON "user_support_images"("name_uuid");

-- CreateIndex
CREATE INDEX "account_verifications_jti_idx" ON "account_verifications"("jti");

-- CreateIndex
CREATE INDEX "file_structure_bin_name_uuid_idx" ON "file_structure_bin"("name_uuid");

-- CreateIndex
CREATE INDEX "recover_passwords_jti_idx" ON "recover_passwords"("jti");

-- CreateIndex
CREATE INDEX "reset_passwords_jti_idx" ON "reset_passwords"("jti");

-- AddForeignKey
ALTER TABLE "user_support" ADD CONSTRAINT "user_support_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_messages" ADD CONSTRAINT "user_support_messages_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_messages" ADD CONSTRAINT "user_support_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_images" ADD CONSTRAINT "user_support_images_user_support_message_id_fkey" FOREIGN KEY ("user_support_message_id") REFERENCES "user_support_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_images" ADD CONSTRAINT "user_support_images_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_images" ADD CONSTRAINT "user_support_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
