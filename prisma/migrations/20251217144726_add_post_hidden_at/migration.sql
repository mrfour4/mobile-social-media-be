-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "hiddenAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Post_hiddenAt_idx" ON "Post"("hiddenAt");

-- CreateIndex
CREATE INDEX "Post_deletedAt_idx" ON "Post"("deletedAt");
