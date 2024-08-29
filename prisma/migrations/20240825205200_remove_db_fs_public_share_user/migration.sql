/*
  Warnings:

  - You are about to drop the `file_structure_share_public_link_user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "file_structure_share_public_link_user" DROP CONSTRAINT "file_structure_share_public_link_user_file_structure_share_fkey";

-- DropForeignKey
ALTER TABLE "file_structure_share_public_link_user" DROP CONSTRAINT "file_structure_share_public_link_user_user_id_fkey";

-- DropTable
DROP TABLE "file_structure_share_public_link_user";
