import { PrismaClient } from '@prisma/client';
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
