-- CreateEnum
CREATE TYPE "PasswordResetPurpose" AS ENUM ('USER_SELF', 'ADMIN_ASSISTED');

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "purpose" "PasswordResetPurpose" NOT NULL DEFAULT 'USER_SELF';

-- CreateIndex
CREATE INDEX "PasswordResetToken_purpose_idx" ON "PasswordResetToken"("purpose");
