import { PrismaClient, RoomType } from '@prisma/client';
import { randomInt } from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const createMany = await prisma.user.createMany({
    data: [
      { displayName: 'Bob', email: 'bob@prisma.io' },
      { displayName: 'Yewande', email: 'yewande@prisma.io' },
      { displayName: 'Angelique', email: 'angelique@prisma.io' },
    ],
    skipDuplicates: true, // Skip 'Bobo'
  });
  console.log(createMany);

  await prisma.chatRoom.createMany({
    data: [
      {
        roomName: 'chatroom1',
        roomType: 'PUBLIC',
        ownerId: 1,
      },
      {
        roomName: 'chatroom2',
        roomType: 'PUBLIC',
        ownerId: 1,
      },
      {
        roomName: 'chatroom3',
        roomType: 'PUBLIC',
        ownerId: 1,
      },
    ],
    skipDuplicates: true,
  });

  // const rooms = [];
  // for (let i = 1; i <= 100000; i++) {
  //   rooms.push({
  //     roomName: `${i}`,
  //     roomType: 'PUBLIC' as RoomType,
  //     ownerId: 1,
  //   });
  // }
  // await prisma.chatRoom.createMany({ data: rooms });

  // for (let i = 1; i <= 10000; i = i++) {
  //   const id = randomInt(1, 100000);
  //   await prisma.chatRoom.update({
  //     where: { id },
  //     data: {
  //       ownerId: 2,
  //     },
  //   });
  // }

  for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 20; j++) {
      await prisma.chatMessage.create({
        data: {
          userId: 1,
          chatRoomId: i,
          content: `${j}`,
        },
      });
    }
  }

  // chatMessageたくさん入れる
  // const data = [];
  // for (let i = 0; i < 1000000; i++) {
  //   data.push({
  //     userId: 1,
  //     chatRoomId: 1,
  //     content: `${i}`,
  //   });
  // }
  // await prisma.chatMessage.createMany({ data });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
