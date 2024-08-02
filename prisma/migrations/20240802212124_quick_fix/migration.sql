/*
  Warnings:

  - You are about to drop the `file_structure_share_public_link` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "file_structure_share_public_link" DROP CONSTRAINT "file_structure_share_public_link_file_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "file_structure_share_public_link" DROP CONSTRAINT "file_structure_share_public_link_user_id_fkey";

-- DropForeignKey
ALTER TABLE "file_structure_share_public_link_user" DROP CONSTRAINT "file_structure_share_public_link_user_file_structure_share_fkey";

-- DropTable
DROP TABLE "file_structure_share_public_link";

-- CreateTable
CREATE TABLE "file_structure_public_share" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "unique_hash" TEXT NOT NULL,
    "is_downloadable" BOOLEAN NOT NULL DEFAULT false,
    "is_password_protected" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_public_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_public_share_file_structure_id_key" ON "file_structure_public_share"("file_structure_id");

-- AddForeignKey
ALTER TABLE "file_structure_public_share" ADD CONSTRAINT "file_structure_public_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_public_share" ADD CONSTRAINT "file_structure_public_share_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share_public_link_user" ADD CONSTRAINT "file_structure_share_public_link_user_file_structure_share_fkey" FOREIGN KEY ("file_structure_share_public_link_id") REFERENCES "file_structure_public_share"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
