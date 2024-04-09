-- CreateTable
CREATE TABLE "file_structure_bin" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_structure_id" INTEGER NOT NULL,

    CONSTRAINT "file_structure_bin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_bin_file_structure_id_key" ON "file_structure_bin"("file_structure_id");

-- AddForeignKey
ALTER TABLE "file_structure_bin" ADD CONSTRAINT "file_structure_bin_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
