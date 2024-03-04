/*
  Warnings:

  - The values [OCTET_STREAM] on the enum `file_mime_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "file_mime_type_new" AS ENUM ('TEXT_PLAIN', 'TEXT_MARKDOWN', 'APPLICATION_JSON', 'APPLICATION_XML', 'APPLICATION_PDF', 'APPLICATION_OCTET_STREAM', 'IMAGE_JPG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_BMP', 'AUDIO_MPEG', 'AUDIO_WAV', 'VIDEO_MP4', 'VIDEO_MPEG', 'VIDEO_WEBM', 'VIDEO_QUICKTIME', 'OTHER');
ALTER TABLE "file_structure" ALTER COLUMN "mime_type" TYPE "file_mime_type_new" USING ("mime_type"::text::"file_mime_type_new");
ALTER TYPE "file_mime_type" RENAME TO "file_mime_type_old";
ALTER TYPE "file_mime_type_new" RENAME TO "file_mime_type";
DROP TYPE "file_mime_type_old";
COMMIT;
