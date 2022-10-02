/*
  Warnings:

  - The values [BANNED,MUTED] on the enum `MemberType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endAt` on the `ChatUserRelation` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberType_new" AS ENUM ('MEMBER', 'ADMIN');
ALTER TABLE "ChatUserRelation" ALTER COLUMN "memberType" DROP DEFAULT;
ALTER TABLE "ChatUserRelation" ALTER COLUMN "memberType" TYPE "MemberType_new" USING ("memberType"::text::"MemberType_new");
ALTER TYPE "MemberType" RENAME TO "MemberType_old";
ALTER TYPE "MemberType_new" RENAME TO "MemberType";
DROP TYPE "MemberType_old";
ALTER TABLE "ChatUserRelation" ALTER COLUMN "memberType" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "ChatUserRelation" DROP COLUMN "endAt";

-- CreateTable
CREATE TABLE "ChatUserAttribute" (
    "userId" INTEGER NOT NULL,
    "chatRoomId" INTEGER NOT NULL,
    "bannedEndAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mutedEndAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readenUntil" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChatUserAttribute_pkey" PRIMARY KEY ("userId","chatRoomId")
);

-- AddForeignKey
ALTER TABLE "ChatUserAttribute" ADD CONSTRAINT "ChatUserAttribute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatUserAttribute" ADD CONSTRAINT "ChatUserAttribute_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
