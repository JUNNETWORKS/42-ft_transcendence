-- AlterEnum
ALTER TYPE "RoomType" ADD VALUE 'DM';

-- CreateTable
CREATE TABLE "FriendRelation" (
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,

    CONSTRAINT "FriendRelation_pkey" PRIMARY KEY ("userId","targetUserId")
);

-- CreateTable
CREATE TABLE "BlockRelation" (
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,

    CONSTRAINT "BlockRelation_pkey" PRIMARY KEY ("userId","targetUserId")
);

-- AddForeignKey
ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRelation" ADD CONSTRAINT "BlockRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRelation" ADD CONSTRAINT "BlockRelation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
