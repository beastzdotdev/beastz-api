-- AlterTable
ALTER TABLE "user_identity" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "strict_mode" BOOLEAN NOT NULL DEFAULT false;
