/*
  Warnings:

  - You are about to drop the `MatchResult` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user1ID` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user1Score` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2ID` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user2Score` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchUserRelationMatchID` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchUserRelationUserID` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('RANKED', 'CASUAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PREPARING', 'PLAYING', 'ERROR', 'FINISHED');

-- DropForeignKey
ALTER TABLE "MatchResult" DROP CONSTRAINT "MatchResult_matchID_fkey";

-- DropForeignKey
ALTER TABLE "MatchResult" DROP CONSTRAINT "MatchResult_userID_fkey";

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PREPARING',
ADD COLUMN     "type" "MatchType" NOT NULL,
ADD COLUMN     "user1ID" INTEGER NOT NULL,
ADD COLUMN     "user1Score" INTEGER NOT NULL,
ADD COLUMN     "user2ID" INTEGER NOT NULL,
ADD COLUMN     "user2Score" INTEGER NOT NULL,
ALTER COLUMN "beginDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "matchUserRelationMatchID" INTEGER NOT NULL,
ADD COLUMN     "matchUserRelationUserID" INTEGER NOT NULL;

-- DropTable
DROP TABLE "MatchResult";

-- CreateTable
CREATE TABLE "MatchRule" (
    "matchID" INTEGER NOT NULL,
    "ballCount" INTEGER NOT NULL,
    "accelerationRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MatchRule_pkey" PRIMARY KEY ("matchID")
);

-- CreateTable
CREATE TABLE "MatchUserRelation" (
    "matchID" INTEGER NOT NULL,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "MatchUserRelation_pkey" PRIMARY KEY ("matchID","userID")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1ID_fkey" FOREIGN KEY ("user1ID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2ID_fkey" FOREIGN KEY ("user2ID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRule" ADD CONSTRAINT "MatchRule_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_matchID_fkey" FOREIGN KEY ("matchID") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchUserRelation" ADD CONSTRAINT "MatchUserRelation_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
