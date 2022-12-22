/*
  Warnings:

  - A unique constraint covering the columns `[matchId]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[messageId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "matchId" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "messageId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_matchId_key" ON "ChatMessage"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_messageId_key" ON "Match"("messageId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
