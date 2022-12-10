/*
  Warnings:

  - You are about to drop the `MatchResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PREPARING', 'IN_PROGRESS', 'DONE', 'ERROR');

-- DropForeignKey
ALTER TABLE "MatchConfig" DROP CONSTRAINT "MatchConfig_matchID_fkey";

-- DropForeignKey
ALTER TABLE "MatchUserRelation" DROP CONSTRAINT "MatchUserRelation_matchID_fkey";

-- DropTable
DROP TABLE "MatchResult";

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "userID1" INTEGER NOT NULL,
    "userScore1" INTEGER NOT NULL,
    "userID2" INTEGER NOT NULL,
    "userScore2" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MatchConfig" ADD CONSTRAINT "MatchConfig_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
