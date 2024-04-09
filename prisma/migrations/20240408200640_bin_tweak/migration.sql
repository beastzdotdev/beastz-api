-- AddForeignKey
ALTER TABLE "file_structure_bin" ADD CONSTRAINT "file_structure_bin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
