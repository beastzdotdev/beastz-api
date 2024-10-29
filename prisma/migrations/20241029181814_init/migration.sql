-- CreateEnum
CREATE TYPE "platform_for_jwt" AS ENUM ('WEB', 'MOB_IOS', 'MOB_ANDROID');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "emotion" AS ENUM ('VERY_BAD', 'BAD', 'NORMAL', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "legal_document_type" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE');

-- CreateEnum
CREATE TYPE "user_support_ticket_status" AS ENUM ('RESOLVED', 'PENDING', 'IGNORED');

-- CreateEnum
CREATE TYPE "file_mime_type" AS ENUM ('TEXT_PLAIN', 'TEXT_MARKDOWN', 'APPLICATION_JSON', 'APPLICATION_XML', 'APPLICATION_PDF', 'APPLICATION_OCTET_STREAM', 'IMAGE_JPG', 'IMAGE_PNG', 'IMAGE_GIF', 'IMAGE_WEBP', 'IMAGE_BMP', 'IMAGE_SVG', 'AUDIO_MPEG', 'AUDIO_WAV', 'VIDEO_MP4', 'VIDEO_MPEG', 'VIDEO_WEBM', 'VIDEO_QUICKTIME', 'OTHER');

-- CreateEnum
CREATE TYPE "encryption_type" AS ENUM ('TEXT', 'PIN');

-- CreateEnum
CREATE TYPE "encryption_algorithm" AS ENUM ('AES_256_GCM');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "birth_date" TIMESTAMPTZ,
    "gender" "gender" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_image_path" VARCHAR(2047),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identitites" (
    "id" SERIAL NOT NULL,
    "is_account_verified" BOOLEAN NOT NULL DEFAULT false,
    "password" VARCHAR(255) NOT NULL,
    "strict_mode" BOOLEAN NOT NULL DEFAULT false,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_identitites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "iss" TEXT NOT NULL,
    "platform" "platform_for_jwt" NOT NULL,
    "exp" TEXT NOT NULL,
    "jti" UUID NOT NULL,
    "iat" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_verifications" (
    "id" SERIAL NOT NULL,
    "security_token" TEXT NOT NULL,
    "jti" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "account_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_verifications_attempt_count" (
    "id" SERIAL NOT NULL,
    "count" SMALLINT NOT NULL DEFAULT 0,
    "count_increase_last_update_date" TIMESTAMPTZ,
    "account_verification_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "account_verifications_attempt_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recover_passwords" (
    "id" SERIAL NOT NULL,
    "security_token" TEXT NOT NULL,
    "jti" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "new_password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "recover_passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recover_passwords_attempt_count" (
    "id" SERIAL NOT NULL,
    "count" SMALLINT NOT NULL DEFAULT 0,
    "count_increase_last_update_date" TIMESTAMPTZ,
    "recover_password_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "recover_passwords_attempt_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_passwords" (
    "id" SERIAL NOT NULL,
    "security_token" TEXT NOT NULL,
    "jti" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "new_password" VARCHAR(255) NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reset_passwords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reset_passwords_attempt_count" (
    "id" SERIAL NOT NULL,
    "count" SMALLINT NOT NULL DEFAULT 0,
    "count_increase_last_update_date" TIMESTAMPTZ,
    "recover_password_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "reset_passwords_attempt_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" "legal_document_type" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_document_paragraphs" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legal_document_id" INTEGER NOT NULL,

    CONSTRAINT "legal_document_paragraphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "review" "emotion" NOT NULL,
    "images" TEXT[],
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "color" VARCHAR(9),
    "depth" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "size_in_bytes" INTEGER,
    "file_exstension_raw" TEXT,
    "mime_type_raw" TEXT,
    "mime_type" "file_mime_type",
    "is_file" BOOLEAN NOT NULL,
    "is_shortcut" BOOLEAN NOT NULL,
    "is_in_bin" BOOLEAN NOT NULL,
    "is_encrypted" BOOLEAN NOT NULL,
    "is_editable" BOOLEAN,
    "is_locked" BOOLEAN NOT NULL,
    "last_modified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uuid" UUID NOT NULL,
    "shared_unique_hash" VARCHAR(16) NOT NULL,
    "document_image_preview_path" TEXT,
    "root_parent_id" INTEGER,
    "parent_id" INTEGER,

    CONSTRAINT "file_structure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_encryption" (
    "id" SERIAL NOT NULL,
    "type" "encryption_type" NOT NULL,
    "algorithm" "encryption_algorithm" NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_encryption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_bookmark" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_share" (
    "id" SERIAL NOT NULL,
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_structure_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_public_share" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_structure_id" INTEGER NOT NULL,
    "is_downloadable" BOOLEAN NOT NULL DEFAULT false,
    "is_password_protected" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "file_structure_public_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_structure_bin" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "name_uuid" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_structure_id" INTEGER NOT NULL,

    CONSTRAINT "file_structure_bin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "uuid" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "user_support_ticket_status" NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "user_support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support_message" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "from_admin" BOOLEAN NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_support_id" INTEGER NOT NULL,

    CONSTRAINT "user_support_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_support_image" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_support_message_id" INTEGER NOT NULL,
    "user_support_id" INTEGER NOT NULL,
    "name_uuid" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_support_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_uuid_idx" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_identitites_user_id_key" ON "user_identitites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "account_verifications_jti_key" ON "account_verifications"("jti");

-- CreateIndex
CREATE INDEX "account_verifications_jti_idx" ON "account_verifications"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "account_verifications_attempt_count_account_verification_id_key" ON "account_verifications_attempt_count"("account_verification_id");

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_jti_key" ON "recover_passwords"("jti");

-- CreateIndex
CREATE INDEX "recover_passwords_jti_idx" ON "recover_passwords"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_attempt_count_recover_password_id_key" ON "recover_passwords_attempt_count"("recover_password_id");

-- CreateIndex
CREATE UNIQUE INDEX "reset_passwords_jti_key" ON "reset_passwords"("jti");

-- CreateIndex
CREATE INDEX "reset_passwords_jti_idx" ON "reset_passwords"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "reset_passwords_attempt_count_recover_password_id_key" ON "reset_passwords_attempt_count"("recover_password_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_key" ON "legal_documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_shared_unique_hash_key" ON "file_structure"("shared_unique_hash");

-- CreateIndex
CREATE INDEX "file_structure_shared_unique_hash_idx" ON "file_structure" USING HASH ("shared_unique_hash");

-- CreateIndex
CREATE INDEX "file_structure_uuid_idx" ON "file_structure"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_encryption_file_structure_id_key" ON "file_structure_encryption"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_share_file_structure_id_key" ON "file_structure_share"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_public_share_file_structure_id_key" ON "file_structure_public_share"("file_structure_id");

-- CreateIndex
CREATE INDEX "file_structure_public_share_file_structure_id_idx" ON "file_structure_public_share"("file_structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_structure_bin_file_structure_id_key" ON "file_structure_bin"("file_structure_id");

-- CreateIndex
CREATE INDEX "file_structure_bin_name_uuid_idx" ON "file_structure_bin"("name_uuid");

-- CreateIndex
CREATE INDEX "user_support_uuid_idx" ON "user_support"("uuid");

-- CreateIndex
CREATE INDEX "user_support_image_name_uuid_idx" ON "user_support_image"("name_uuid");

-- AddForeignKey
ALTER TABLE "user_identitites" ADD CONSTRAINT "user_identitites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_verifications" ADD CONSTRAINT "account_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_verifications_attempt_count" ADD CONSTRAINT "account_verifications_attempt_count_account_verification_i_fkey" FOREIGN KEY ("account_verification_id") REFERENCES "account_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recover_passwords" ADD CONSTRAINT "recover_passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recover_passwords_attempt_count" ADD CONSTRAINT "recover_passwords_attempt_count_recover_password_id_fkey" FOREIGN KEY ("recover_password_id") REFERENCES "recover_passwords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_passwords" ADD CONSTRAINT "reset_passwords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reset_passwords_attempt_count" ADD CONSTRAINT "reset_passwords_attempt_count_recover_password_id_fkey" FOREIGN KEY ("recover_password_id") REFERENCES "reset_passwords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_document_paragraphs" ADD CONSTRAINT "legal_document_paragraphs_legal_document_id_fkey" FOREIGN KEY ("legal_document_id") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure" ADD CONSTRAINT "file_structure_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "file_structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure" ADD CONSTRAINT "file_structure_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_encryption" ADD CONSTRAINT "file_structure_encryption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_encryption" ADD CONSTRAINT "file_structure_encryption_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bookmark" ADD CONSTRAINT "file_structure_bookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bookmark" ADD CONSTRAINT "file_structure_bookmark_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_share" ADD CONSTRAINT "file_structure_share_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_public_share" ADD CONSTRAINT "file_structure_public_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_public_share" ADD CONSTRAINT "file_structure_public_share_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bin" ADD CONSTRAINT "file_structure_bin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_structure_bin" ADD CONSTRAINT "file_structure_bin_file_structure_id_fkey" FOREIGN KEY ("file_structure_id") REFERENCES "file_structure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support" ADD CONSTRAINT "user_support_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_message" ADD CONSTRAINT "user_support_message_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_message" ADD CONSTRAINT "user_support_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_support_message_id_fkey" FOREIGN KEY ("user_support_message_id") REFERENCES "user_support_message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_support_id_fkey" FOREIGN KEY ("user_support_id") REFERENCES "user_support"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_support_image" ADD CONSTRAINT "user_support_image_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
