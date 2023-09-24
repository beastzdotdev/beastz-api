-- AlterTable
ALTER TABLE "account_verifications_attempt_count" ALTER COLUMN "count_increase_last_update_date" DROP NOT NULL,
ALTER COLUMN "count_increase_last_update_date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "recover_passwords_attempt_count" ALTER COLUMN "count_increase_last_update_date" DROP NOT NULL,
ALTER COLUMN "count_increase_last_update_date" DROP DEFAULT;
