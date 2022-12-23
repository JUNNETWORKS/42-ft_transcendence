-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "relatedRoomId" INTEGER;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_relatedRoomId_fkey" FOREIGN KEY ("relatedRoomId") REFERENCES "ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
