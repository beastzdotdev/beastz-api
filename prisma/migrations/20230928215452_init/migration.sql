-- CreateEnum
CREATE TYPE "platform_for_jwt" AS ENUM ('WEB', 'MOB_IOS', 'MOB_ANDROID');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "emotion" AS ENUM ('VERY_BAD', 'BAD', 'NORMAL', 'GOOD', 'VERY_GOOD');

-- CreateEnum
CREATE TYPE "legal_document_type" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "email" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "birth_date" TIMESTAMPTZ NOT NULL,
    "gender" "gender" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "socket_id" VARCHAR(32) NOT NULL,
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
    "cypher_iv" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "secret_key_encrypted" VARCHAR(255) NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_identitites_user_id_key" ON "user_identitites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_jti_idx" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "account_verifications_jti_key" ON "account_verifications"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "account_verifications_attempt_count_account_verification_id_key" ON "account_verifications_attempt_count"("account_verification_id");

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_jti_key" ON "recover_passwords"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "recover_passwords_attempt_count_recover_password_id_key" ON "recover_passwords_attempt_count"("recover_password_id");

-- CreateIndex
CREATE UNIQUE INDEX "reset_passwords_jti_key" ON "reset_passwords"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "reset_passwords_attempt_count_recover_password_id_key" ON "reset_passwords_attempt_count"("recover_password_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_key" ON "legal_documents"("type");

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
