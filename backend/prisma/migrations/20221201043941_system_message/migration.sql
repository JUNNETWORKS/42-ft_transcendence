-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "messageType" TEXT,
ADD COLUMN     "secondaryUserId" INTEGER,
ADD COLUMN     "subpayload" JSONB;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_secondaryUserId_fkey" FOREIGN KEY ("secondaryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
