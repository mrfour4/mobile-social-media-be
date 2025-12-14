-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isOnline" BOOLEAN DEFAULT false,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);
