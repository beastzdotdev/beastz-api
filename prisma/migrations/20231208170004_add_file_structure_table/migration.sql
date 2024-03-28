-- CreateEnum
CREATE TYPE "file_mime_type" AS ENUM ('TEXT_PLAIN', 'TEXT_MARKDOWN', 'APPLICATION_JSON', 'APPLICATION_XML', 'APPLICATION_PDF', 'IMAGE_JPG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_BMP', 'AUDIO_MPEG', 'AUDIO_WAV', 'VIDEO_MP4', 'VIDEO_MPEG', 'VIDEO_WEBM', 'VIDEO_QUICKTIME');

-- CreateTable
CREATE TABLE "FileStructure" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "is_file" BOOLEAN NOT NULL,
    "depth" INTEGER NOT NULL,
    "size_in_bytes" BIGINT,
    "mime_type_raw" TEXT,
    "mime_type" "file_mime_type",
    "parent_id" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileStructure_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileStructure" ADD CONSTRAINT "FileStructure_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "FileStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
