import { PrismaClient, RoomType, User } from '@prisma/client';

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
    { displayName: 'Lorem', email: 'Lorem@prisma.io', intraId: 4 },
    { displayName: 'ipsum', email: 'ipsum@prisma.io', intraId: 5 },
    { displayName: 'dolor', email: 'dolor@prisma.io', intraId: 6 },
    { displayName: 'sit', email: 'sit@prisma.io', intraId: 7 },
    { displayName: 'amet', email: 'amet@prisma.io', intraId: 8 },
    { displayName: 'consectetur', email: 'badass@prisma.io', intraId: 9 },
  ].reduce((prev: Promise<User[]>, d, i) => {
    return prev.then((leadings) => {
      return prisma.user
        .create({
          data: {
            ...d,
            password: UsersService.hash_password(d.displayName),
            userRankPoint: {
              create: {
                rankPoint: 100 * i,
              },
            },
          },
        })
        .then((u) => [...leadings, u]);
    });
  }, Promise.resolve<User[]>([]));
  console.log(createMany);

  const data: {
    roomName: string;
    roomType: RoomType;
    ownerId: number;
  }[] = [
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
  ];
  for (let i = 1; i <= 512; ++i) {
    data.push({
      roomName: `chatroom-v${i + 1}`,
      roomType: 'PUBLIC',
      ownerId: createMany[Math.floor(Math.random() * createMany.length)].id,
    });
  }
  const r = await prisma.chatRoom.createMany({
    data,
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
    for (let j = 1; j <= 512; j++) {
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

  await prisma.match.create({
    data: {
      id: 'hogeta',
      matchType: 'CASUAL',
      matchStatus: 'DONE',
      userID1: 3,
      userScore1: 15,
      userID2: 2,
      userScore2: 4,
      startAt: new Date(),
      endAt: new Date(),
      config: {
        create: {
          maxScore: 15,
          speed: 10,
        },
      },
      matchUserRelation: {
        create: [
          {
            userID: 3,
          },
          {
            userID: 2,
          },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      id: 'fugata',
      matchType: 'CASUAL',
      matchStatus: 'DONE',
      userID1: 3,
      userScore1: 4,
      userID2: 2,
      userScore2: 15,
      startAt: new Date(),
      endAt: new Date(),
      config: {
        create: {
          maxScore: 15,
          speed: 10,
        },
      },
      matchUserRelation: {
        create: [
          {
            userID: 3,
          },
          {
            userID: 2,
          },
        ],
      },
    },
  });
  await prisma.match.create({
    data: {
      id: 'piyota',
      matchType: 'CASUAL',
      matchStatus: 'DONE',
      userID1: 3,
      userScore1: 15,
      userID2: 2,
      userScore2: 8,
      startAt: new Date(),
      endAt: new Date(),
      config: {
        create: {
          maxScore: 15,
          speed: 10,
        },
      },
      matchUserRelation: {
        create: [
          {
            userID: 3,
          },
          {
            userID: 2,
          },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      id: 'hogehogeta',
      matchType: 'RANK',
      matchStatus: 'DONE',
      userID1: 4,
      userScore1: 15,
      userID2: 3,
      userScore2: 4,
      startAt: new Date(),
      endAt: new Date(),
      config: {
        create: {
          maxScore: 15,
          speed: 10,
        },
      },
      matchUserRelation: {
        create: [
          {
            userID: 4,
          },
          {
            userID: 3,
          },
        ],
      },
    },
  });

  await prisma.match.create({
    data: {
      id: 'fugafugata',
      matchType: 'PRIVATE',
      matchStatus: 'DONE',
      userID1: 3,
      userScore1: 12,
      userID2: 2,
      userScore2: 15,
      startAt: new Date(),
      endAt: new Date(),
      config: {
        create: {
          maxScore: 15,
          speed: 10,
        },
      },
      matchUserRelation: {
        create: [
          {
            userID: 3,
          },
          {
            userID: 2,
          },
        ],
      },
    },
  });
  // data: {
  //   id: 'hogeta',
  //   matchType: 'CASUAL',
  //   userID1: 3,
  //   userScore1: 15,
  //   userID2: 2,
  //   userScore2: 4,
  //   endAt: new Date(),
  //   config: {
  //     create: {
  //       maxScore: 15,
  //       speed: 10,
  //     },
  //   },
  //   matchUserRelation: {
  //     create: [
  //       {
  //         userID: 3,
  //       },
  //       {
  //         userID: 2,
  //       },
  //     ],
  //   },
  // },

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
