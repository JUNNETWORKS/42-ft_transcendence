-- DropIndex
DROP INDEX "ChatRoom_roomName_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEnabled2FA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEnabledAvatar" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserAvatar" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "avatar" BYTEA NOT NULL,
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TotpSecret" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" TEXT NOT NULL,

    CONSTRAINT "TotpSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatar_userId_key" ON "UserAvatar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TotpSecret_userId_key" ON "TotpSecret"("userId");
