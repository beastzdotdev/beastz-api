/*
  Warnings:

  - You are about to drop the `FileStructure` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileStructure" DROP CONSTRAINT "FileStructure_parent_id_fkey";

-- DropTable
DROP TABLE "FileStructure";

-- CreateTable
CREATE TABLE "file_structure" (
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

    CONSTRAINT "file_structure_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "file_structure" ADD CONSTRAINT "file_structure_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "file_structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
