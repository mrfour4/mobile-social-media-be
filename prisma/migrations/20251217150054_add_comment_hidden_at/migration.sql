-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Comment_hiddenAt_idx" ON "Comment"("hiddenAt");

-- CreateIndex
CREATE INDEX "Comment_deletedAt_idx" ON "Comment"("deletedAt");
