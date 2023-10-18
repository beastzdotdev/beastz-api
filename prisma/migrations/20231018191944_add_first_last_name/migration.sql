/*
  Warnings:

  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "lat_name" VARCHAR(255) NOT NULL;
