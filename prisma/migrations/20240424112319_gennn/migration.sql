/*
  Warnings:

  - You are about to drop the `user_support_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_support_messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_support_images" DROP CONSTRAINT "user_support_images_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_support_images" DROP CONSTRAINT "user_support_images_user_support_id_fkey";

-- DropForeignKey
ALTER TABLE "user_support_images" DROP CONSTRAINT "user_support_images_user_support_message_id_fkey";

-- DropForeignKey
ALTER TABLE "user_support_messages" DROP CONSTRAINT "user_support_messages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_support_messages" DROP CONSTRAINT "user_support_messages_user_support_id_fkey";

-- DropTable
DROP TABLE "user_support_images";

-- DropTable
DROP TABLE "user_support_messages";

-- CreateTable
CREATE TABLE "user_support_message" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "from_admin" BOOLEAN NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_support_id" INTEGER NOT NULL,

    CONSTRAINT "user_support_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support_image" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_support_message_id" INTEGER NOT NULL,
    "user_support_id" INTEGER NOT NULL,
    "name_uuid" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_support_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_support_image_name_uuid_idx" ON "user_support_image"("name_uuid");

-- AddForeignKey
ALTER TABLE "user_support_message" ADD CONSTRAINT "user_support_message_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_message" ADD CONSTRAINT "user_support_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_support_message_id_fkey" FOREIGN KEY ("user_support_message_id") REFERENCES "user_support_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
