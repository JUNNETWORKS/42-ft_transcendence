import { Prisma, PrismaClient } from '@prisma/client';
import { PostMessageDto } from 'src/chatrooms/dto/post-message.dto';

const prisma = new PrismaClient();

export const resetTable = async (
  modelNames: Prisma.ModelName[]
): Promise<void> => {
  const tablenames = modelNames.map((modelName) => ({ tablename: modelName }));
  for (const { tablename } of tablenames) {
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
      );
    } catch (error) {
      console.log({ error });
    }
  }
  // prisma.$disconnect();
};

export const createRooms = async () => {
  await prisma.chatRoom.create({
    data: {
      roomName: 'public room',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: {
        create: [{ userId: 1, memberType: 'ADMIN' }],
      },
    },
  });

  await prisma.chatRoom.create({
    data: {
      roomName: 'locked room',
      roomType: 'LOCKED',
      roomPassword: 'testpass',
      ownerId: 1,
      roomMember: {
        create: [{ userId: 1, memberType: 'ADMIN' }],
      },
    },
  });

  await prisma.chatRoom.create({
    data: {
      roomName: 'private room',
      roomType: 'PRIVATE',
      ownerId: 1,
      roomMember: {
        create: [{ userId: 1, memberType: 'ADMIN' }],
      },
    },
  });

  await prisma.chatRoom.create({
    data: {
      roomName: 'public room2',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: {
        create: [{ userId: 1, memberType: 'ADMIN' }],
      },
    },
  });

  await prisma.chatRoom.create({
    data: {
      roomName: 'public room3',
      roomType: 'PUBLIC',
      ownerId: 1,
      roomMember: {
        create: [{ userId: 1, memberType: 'ADMIN' }],
      },
    },
  });
};

export const postMessages = async () => {
  const messages: PostMessageDto[] = [];
  for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
      for (let k = 1; k <= 5; k++) {
        messages.push({
          userId: j,
          chatRoomId: i,
          content: `${k}`,
        });
      }
    }
  }
  await prisma.chatMessage.createMany({
    data: messages,
  });
};
