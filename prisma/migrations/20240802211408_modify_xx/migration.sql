/*
  Warnings:

  - You are about to drop the column `custom_title` on the `file_structure_share_public_link` table. All the data in the column will be lost.
  - You are about to drop the column `is_restricted_to_only_users` on the `file_structure_share_public_link` table. All the data in the column will be lost.
  - Made the column `expires_at` on table `file_structure_share_public_link` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "file_structure_share_public_link" DROP COLUMN "custom_title",
DROP COLUMN "is_restricted_to_only_users",
ALTER COLUMN "expires_at" SET NOT NULL;
