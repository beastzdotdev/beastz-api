-- AlterTable
ALTER TABLE "account_verifications_attempt_count" ADD COLUMN     "count_increase_last_update_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "recover_passwords_attempt_count" ADD COLUMN     "count_increase_last_update_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
