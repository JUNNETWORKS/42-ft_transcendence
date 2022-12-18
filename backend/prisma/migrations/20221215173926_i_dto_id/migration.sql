/*
  Warnings:

  - You are about to drop the column `userID1` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `userID2` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `matchID` on the `MatchConfig` table. All the data in the column will be lost.
  - You are about to drop the column `matchID` on the `MatchUserRelation` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `MatchUserRelation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matchId]` on the table `MatchConfig` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,matchId]` on the table `MatchUserRelation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId1` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId2` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchId` to the `MatchConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchId` to the `MatchUserRelation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `MatchUserRelation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MatchConfig" DROP CONSTRAINT "MatchConfig_matchID_fkey";

-- DropForeignKey
ALTER TABLE "MatchUserRelation" DROP CONSTRAINT "MatchUserRelation_matchID_fkey";

-- DropForeignKey
ALTER TABLE "MatchUserRelation" DROP CONSTRAINT "MatchUserRelation_userID_fkey";

-- DropIndex
DROP INDEX "MatchConfig_matchID_key";

-- DropIndex
DROP INDEX "MatchUserRelation_userID_matchID_key";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "userID1",
DROP COLUMN "userID2",
ADD COLUMN     "userId1" INTEGER NOT NULL,
ADD COLUMN     "userId2" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MatchConfig" DROP COLUMN "matchID",
ADD COLUMN     "matchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MatchUserRelation" DROP COLUMN "matchID",
DROP COLUMN "userID",
ADD COLUMN     "matchId" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MatchConfig_matchId_key" ON "MatchConfig"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchUserRelation_userId_matchId_key" ON "MatchUserRelation"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "MatchConfig" ADD CONSTRAINT "MatchConfig_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
