/*
  Warnings:

  - A unique constraint covering the columns `[matchId,userSlot]` on the table `MatchUserRelation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userSlot` to the `MatchUserRelation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserSlotNumber" AS ENUM ('SLOT1', 'SLOT2');

-- AlterTable
ALTER TABLE "MatchUserRelation" ADD COLUMN     "userSlot" "UserSlotNumber" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MatchUserRelation_matchId_userSlot_key" ON "MatchUserRelation"("matchId", "userSlot");
