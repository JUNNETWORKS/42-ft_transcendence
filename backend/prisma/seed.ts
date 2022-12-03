import { PrismaClient, User } from '@prisma/client';

import { UsersService } from '../src/users/users.service';
const prisma = new PrismaClient();

async function main() {
  const createMany = await [
    { displayName: 'Bob', email: 'bob@prisma.io', intraId: 0 },
    { displayName: 'Yewande', email: 'yewande@prisma.io', intraId: 1 },
    {
      displayName:
        'AngeliqueAngeliqueAngeliqueAngeliqueAngeliqueAngeliqueAngeliqueAngelique',
      email:
        'angelique@prisma.prisma.prisma.prisma.prisma.prisma.prisma.prisma.prisma.prisma.prisma.io',
      intraId: 2,
    },
    { displayName: 'yokawada', email: 'yokawada@prisma.io', intraId: 3 },
    { displayName: 'badass', email: 'badass@prisma.io', intraId: 4 },
  ].reduce((prev: Promise<User[]>, d) => {
    return prev.then((leadings) => {
      return prisma.user
        .create({
          data: {
            ...d,
            password: UsersService.hash_password(d.displayName),
            userRankPoint: {
              create: {},
            },
          },
        })
        .then((u) => [...leadings, u]);
    });
  }, Promise.resolve<User[]>([]));
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
      {
        roomName: 'test-dm1',
        roomType: 'DM',
        ownerId: 1,
      },
      {
        roomName: 'test-dm2',
        roomType: 'DM',
        ownerId: 2,
      },
      {
        roomName: 'test-dm3',
        roomType: 'DM',
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
    for (let j = 1; j <= 200; j++) {
      await prisma.chatMessage.create({
        data: {
          userId: 1,
          chatRoomId: i,
          content: `${j}`,
        },
      });
    }
  }

  await prisma.chatUserRelation.create({
    data: {
      userId: 1,
      chatRoomId: 4,
      memberType: 'ADMIN',
    },
  });

  await prisma.chatUserRelation.create({
    data: {
      userId: 2,
      chatRoomId: 4,
      memberType: 'MEMBER',
    },
  });

  await prisma.chatUserRelation.create({
    data: {
      userId: 2,
      chatRoomId: 5,
      memberType: 'ADMIN',
    },
  });

  await prisma.chatUserRelation.create({
    data: {
      userId: 3,
      chatRoomId: 5,
      memberType: 'MEMBER',
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 1,
      chatRoomId: 4,
      content: `test dm message from user1`,
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 2,
      chatRoomId: 4,
      content: `test dm message from user2`,
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 2,
      chatRoomId: 5,
      content: `test dm message from user2`,
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 3,
      chatRoomId: 5,
      content: `test dm message from user3`,
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 5,
      chatRoomId: 1,
      content: 'something fxxkin message',
    },
  });

  await prisma.chatUserRelation.create({
    data: {
      userId: 1,
      chatRoomId: 6,
      memberType: 'ADMIN',
    },
  });

  await prisma.chatUserRelation.create({
    data: {
      userId: 5,
      chatRoomId: 6,
      memberType: 'MEMBER',
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: 5,
      chatRoomId: 6,
      content: 'something fxxkin message',
    },
  });

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
