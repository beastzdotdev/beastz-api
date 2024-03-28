/*
  Warnings:

  - You are about to drop the column `is_online` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lat_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `socket_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uuid` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_online",
DROP COLUMN "lat_name",
DROP COLUMN "socket_id",
ADD COLUMN     "last_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "uuid" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "users_uuid_idx" ON "users"("uuid");
