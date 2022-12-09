-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('RANK', 'CASUAL', 'PRIVATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lockUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserRankPoint" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rankPoint" INTEGER NOT NULL DEFAULT 1500,

    CONSTRAINT "UserRankPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "matchType" "MatchType" NOT NULL,
    "userID1" INTEGER NOT NULL,
    "userScore1" INTEGER NOT NULL,
    "userID2" INTEGER NOT NULL,
    "userScore2" INTEGER NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchConfig" (
    "id" SERIAL NOT NULL,
    "matchID" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MatchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchUserRelation" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "matchID" TEXT NOT NULL,

    CONSTRAINT "MatchUserRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRankPoint_userId_key" ON "UserRankPoint"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchConfig_matchID_key" ON "MatchConfig"("matchID");

-- CreateIndex
CREATE UNIQUE INDEX "MatchUserRelation_userID_key" ON "MatchUserRelation"("userID");

-- CreateIndex
CREATE UNIQUE INDEX "MatchUserRelation_matchID_key" ON "MatchUserRelation"("matchID");

-- AddForeignKey
ALTER TABLE "UserRankPoint" ADD CONSTRAINT "UserRankPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchConfig" ADD CONSTRAINT "MatchConfig_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "MatchResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
