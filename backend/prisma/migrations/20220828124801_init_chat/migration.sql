-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" SERIAL NOT NULL,
    "roomName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatUserRelation" (
    "userId" INTEGER NOT NULL,
    "chatRoomId" INTEGER NOT NULL,

    CONSTRAINT "ChatUserRelation_pkey" PRIMARY KEY ("userId","chatRoomId")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "chatRoomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_roomName_key" ON "ChatRoom"("roomName");

-- AddForeignKey
ALTER TABLE "ChatUserRelation" ADD CONSTRAINT "ChatUserRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatUserRelation" ADD CONSTRAINT "ChatUserRelation_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
