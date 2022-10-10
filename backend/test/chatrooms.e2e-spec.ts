import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { createRooms, postMessages, resetTable } from './testUtils';
import { CreateChatroomDto } from '../src/chatrooms/dto/create-chatroom.dto';
import { ChatroomEntity } from 'src/chatrooms/entities/chatroom.entity';
import { UpdateRoomTypeDto } from 'src/chatrooms/dto/update-room-type.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateRoomMemberDto } from 'src/chatrooms/dto/create-room-member.dto';
import { RoomMemberDto } from 'src/chatrooms/dto/room-member.dto';
import { ChatUserRelationEntity } from 'src/chatrooms/entities/chat-user-relation.entity';
import { PostMessageDto } from 'src/chatrooms/dto/post-message.dto';
import { ChatMessageEntity } from 'src/chatrooms/entities/chat-message.entity';

describe('/Chatrooms (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get(PrismaService);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await resetTable(['ChatRoom', 'ChatMessage']);

    // seeding test data
    await createRooms();
    await postMessages();
  });

  describe('POST /chatrooms', () => {
    it('success', async () => {
      const body: CreateChatroomDto = {
        roomName: 'testroom',
        roomType: 'PUBLIC',
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'ADMIN' }],
      };
      const res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(201);

      expect(res.body.roomName).toEqual(body.roomName);
    });

    it('ownerがmemberに含まれない時エラー', async () => {
      const body: CreateChatroomDto = {
        roomName: 'testroom',
        roomType: 'PUBLIC',
        ownerId: 1,
        roomMember: [{ userId: 2, memberType: 'MEMBER' }],
      };
      const res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });

    it('ownerがADMINでないときエラー', async () => {
      const body: CreateChatroomDto = {
        roomName: 'testroom',
        roomType: 'PUBLIC',
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'MEMBER' }],
      };
      const res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });

    it('roomName validation', async () => {
      const body = {
        roomName: 'testroom' as any,
        roomType: 'PUBLIC',
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'ADMIN' }],
      };

      let res;

      body.roomName = '';
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomName =
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomName = 10;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      delete body.roomName;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });

    it('roomType validation', async () => {
      const body = {
        roomName: 'testroom',
        roomType: 'PUBLIC' as any,
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'ADMIN' }],
      };

      let res;

      body.roomType = 'NO_SUCH_VAL';
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      delete body.roomType;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });

    it('roomPassword validation', async () => {
      const body = {
        roomName: 'testroom',
        roomType: 'PUBLIC',
        roomPassword: 'string' as any,
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'ADMIN' }],
      };

      let res;

      body.roomPassword = 10;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomPassword = 'testpass';
      body.roomType = 'PUBLIC';
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      delete body.roomPassword;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(201);

      body.roomType = 'LOCKED';
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });

    it('roomMember validation', async () => {
      const body = {
        roomName: 'testroom',
        roomType: 'PUBLIC',
        ownerId: 1,
        roomMember: [{ userId: 1, memberType: 'ADMIN' }] as any,
      };

      let res;

      body.roomMember = [10];
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomMember = [{ userId: 1, memberType: 'ADMIN' }, 10];
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      delete body.roomMember;
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomMember = [
        { userId: 1, memberType: 'MEMBER' },
        { userId: 2, memberType: 'NOSUCH' },
      ];
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomMember = [
        { userId: 1, memberType: 'MEMBER' },
        { userId: 2, memberType: 'BANNED' },
      ];
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);

      body.roomMember = [
        { userId: 1, memberType: 'ADMIN' },
        { userId: 2, memberType: 'ADMIN' },
      ];
      res = await request(app.getHttpServer())
        .post('/chatrooms')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(201);
    });
  });

  describe('GET /chatrooms', () => {
    it('success privateなチャットルームを取得しない', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms?take=5')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity[] = res.body;
      expect(response.length).toEqual(4);
      response.forEach((chatRoom) => {
        expect(chatRoom.roomType).not.toEqual('PRIVATE');
      });
    });

    it('success take minus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms?take=-1')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity[] = res.body;
      expect(response.length).toEqual(1);
      expect(response[0].id).toEqual(5);
    });

    it('success cursor', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms?take=5&cursor=2')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity[] = res.body;
      expect(response.length).toEqual(2);
      expect(response[0].id).toEqual(4);
      expect(response[1].id).toEqual(5);
    });

    it('success cursor minus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms?take=-2&cursor=6')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity[] = res.body;
      expect(response.length).toEqual(2);
      expect(response[0].id).toEqual(4);
      expect(response[1].id).toEqual(5);
    });

    it('success cursor 存在しないid', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms?take=2&cursor=0')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity[] = res.body;
      expect(response.length).toEqual(2);
      expect(response[0].id).toEqual(1);
      expect(response[1].id).toEqual(2);
    });
  });

  describe('GET /chatrooms/{id}', () => {
    it('success', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/2')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatroomEntity = res.body;
      expect(response.roomName).toEqual('locked room');
      expect(response.roomType).toEqual('LOCKED');
      expect(response.roomPassword).toEqual('testpass');
    });

    it('存在しないroomIdはエラー', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/999')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(500);
    });
  });

  describe('PATCH /chatrooms/{id}/join', () => {
    it('success', async () => {
      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/join?userId=2')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
    });
  });

  describe('DELETE /chatrooms/{id}/leave', () => {
    it('success', async () => {
      let res = await request(app.getHttpServer())
        .put('/chatrooms/1/join?userId=2')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);

      res = await request(app.getHttpServer())
        .delete('/chatrooms/1/leave?userId=2')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
    });

    // it('joinしていないroomからleave', async () => {
    //   const res = await request(app.getHttpServer())
    //     .put('/chatrooms/1/leave?userId=2')
    //     .set('Accept', 'application/json');

    //   expect(res.status).toEqual(200);
    // });
  });

  describe('GET /chatrooms/members', () => {
    it('success', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/1/members')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      const response: ChatUserRelationEntity[] = res.body;
      expect(response.length).toEqual(1);
      expect(response[0].chatRoomId).toEqual(1);
      expect(response[0].userId).toEqual(1);
      expect(response[0].memberType).toEqual('ADMIN');
    });
  });

  describe('PATCH /chatrooms/roomType', () => {
    it('不要なパスワードをエラーとして判定', async () => {
      const body = {
        roomType: 'PRIVATE',
        roomPassword: 'testpass',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/roomType')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(400);
    });

    it('パスワードなしをエラーとして判定', async () => {
      const body = {
        roomType: 'LOCKED',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/roomType')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(400);
    });

    it('PUBLIC -> LOCKED', async () => {
      const body: UpdateRoomTypeDto = {
        roomType: 'LOCKED',
        roomPassword: 'testpass',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/roomType')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(200);
      expect(res.body.roomPassword).toEqual('testpass');
    });

    it('LOCKED -> PUBLIC', async () => {
      const body = {
        roomType: 'PUBLIC',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/2/roomType')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(200);
      expect(res.body.roomPassword).toEqual(null);
    });
  });

  describe('PATCH /chatrooms/roomName', () => {
    it('success', async () => {
      const body = {
        roomName: 'new chatrooms name',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/2/roomName')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(200);
      expect(res.body.roomName).toEqual('new chatrooms name');
    });

    it('重複エラー', async () => {
      const body = {
        roomName: 'public room',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/2/roomName')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(500);
    });

    it('validationエラー', async () => {
      const body = {
        roomName: null,
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/2/roomName')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(400);
    });
  });

  describe('PATCH / chatrooms/addMember', () => {
    it('success', async () => {
      const body: CreateRoomMemberDto = {
        userId: 2,
        memberType: 'MEMBER',
      };
      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/addMember')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(200);
    });

    it('useId validation', async () => {
      const body = {
        roomMember: [
          { userId: 3, memberType: 'ADMIN' },
          { userId: 'hoge', memberType: 'MEMBER' },
        ],
      };
      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/addMember')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(400);
    });

    it('存在しないuseId', async () => {
      const body = {
        roomMember: [{ userId: 999, memberType: 'ADMIN' }],
      };
      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/addMember')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(500);
    });
  });

  describe('PATCH /chatrooms/memberType', () => {
    it('MEMBER -> ADMIN', async () => {
      const pbody: CreateRoomMemberDto = {
        userId: 2,
        memberType: 'MEMBER',
      };
      await request(app.getHttpServer())
        .put('/chatrooms/1/addMember')
        .set('Accept', 'application/json')
        .send(pbody);

      const body: RoomMemberDto = {
        userId: 2,
        memberType: 'ADMIN',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/memberType')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(200);
      expect(res.body.memberType).toEqual('ADMIN');
    });

    it('ADMIN -> MEMBER', async () => {
      const pbody: CreateRoomMemberDto = {
        userId: 2,
        memberType: 'MEMBER',
      };
      await request(app.getHttpServer())
        .put('/chatrooms/1/addMember')
        .set('Accept', 'application/json')
        .send(pbody);

      const toAdmin: RoomMemberDto = {
        userId: 2,
        memberType: 'ADMIN',
      };

      let res = await request(app.getHttpServer())
        .put('/chatrooms/1/memberType')
        .set('Accept', 'application/json')
        .send(toAdmin);
      expect(res.status).toEqual(200);
      expect(res.body.memberType).toEqual('ADMIN');

      const toMember: RoomMemberDto = {
        userId: 2,
        memberType: 'MEMBER',
      };
      res = await request(app.getHttpServer())
        .put('/chatrooms/1/memberType')
        .set('Accept', 'application/json')
        .send(toMember);
      expect(res.status).toEqual(200);
      expect(res.body.memberType).toEqual('MEMBER');
    });

    it('OWNERからの変更はエラー', async () => {
      const body: RoomMemberDto = {
        userId: 1,
        memberType: 'MEMBER',
      };

      const res = await request(app.getHttpServer())
        .put('/chatrooms/1/memberType')
        .set('Accept', 'application/json')
        .send(body);
      expect(res.status).toEqual(400);
    });
  });

  describe('DELETE /chatrooms/{id}', () => {
    it('success', async () => {
      let res = await request(app.getHttpServer())
        .delete('/chatrooms/1')
        .set('Accept', 'application/json');
      expect(res.status).toEqual(200);

      res = await request(app.getHttpServer())
        .get('/chatrooms/1')
        .set('Accept', 'application/json');
      expect(res.status).toEqual(500);
    });
  });

  describe('GET /chatrooms/messages', () => {
    it('カーソルなし take plus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/messages?roomId=1&take=5')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(5);
      let id = 11;
      let content = 1;
      res.body.forEach((message: ChatMessageEntity) => {
        expect(message.id).toEqual(id++);
        expect(message.userId).toEqual(3);
        expect(message.content).toEqual(`${content++}`);
      });
    });

    it('カーソルなし take minus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/messages?roomId=1&take=-5')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(5);
      let id = 1;
      let content = 1;
      res.body.forEach((message: ChatMessageEntity) => {
        expect(message.id).toEqual(id++);
        expect(message.userId).toEqual(1);
        expect(message.content).toEqual(`${content++}`);
      });
    });

    it('カーソルあり take plus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/messages?roomId=1&take=5&cursor=11')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(5);
      let id = 6;
      let content = 1;
      res.body.forEach((message: ChatMessageEntity) => {
        expect(message.id).toEqual(id++);
        expect(message.userId).toEqual(2);
        expect(message.content).toEqual(`${content++}`);
      });
    });

    it('カーソルあり take minus', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/messages?roomId=1&take=-5&cursor=11')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(4);
      let id = 12;
      let content = 2;
      res.body.forEach((message: ChatMessageEntity) => {
        expect(message.id).toEqual(id++);
        expect(message.userId).toEqual(3);
        expect(message.content).toEqual(`${content++}`);
      });
    });

    it('カーソルあり 存在しないmessageID', async () => {
      const res = await request(app.getHttpServer())
        .get('/chatrooms/messages?roomId=1&take=5&cursor=999')
        .set('Accept', 'application/json');

      expect(res.status).toEqual(200);
      expect(res.body.length).toEqual(5);
      expect(res.body[0].id).toEqual(11);
      expect(res.body[0].userId).toEqual(3);
      expect(res.body[0].content).toEqual('1');
    });

    // it('存在しないroomID', async () => {
    //   const res = await request(app.getHttpServer())
    //     .get('/chatrooms/messages?roomId=999&take=5')
    //     .set('Accept', 'application/json');

    //   expect(res.status).toEqual(400);
    // });
  });

  describe('POST /chatrooms/messages', () => {
    it('success', async () => {
      const body: PostMessageDto = {
        chatRoomId: 1,
        userId: 1,
        content: 'hogehoge',
      };
      const res = await request(app.getHttpServer())
        .post('/chatrooms/messages')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(201);
      expect(res.body.content).toEqual('hogehoge');
    });

    it('post後ユーザーを削除', async () => {
      await prismaService.user.create({
        data: {
          displayName: 'test_user',
          email: 'test@test.com',
          intraId: 999,
        },
      });
      const body: PostMessageDto = {
        chatRoomId: 1,
        userId: 4,
        content: 'hogehoge',
      };
      const res = await request(app.getHttpServer())
        .post('/chatrooms/messages')
        .set('Accept', 'application/json')
        .send(body);

      expect(res.status).toEqual(201);
      expect(res.body.userId).toEqual(4);
      expect(res.body.content).toEqual('hogehoge');

      const messageId = res.body.id;

      await prismaService.user.delete({
        where: { id: 4 },
      });
      const message = await prismaService.chatMessage.findFirst({
        where: {
          chatRoomId: 1,
        },
        take: -1,
      });
      expect(message?.id).toEqual(messageId);
      expect(message?.content).toEqual('hogehoge');
      expect(message?.userId).toBeNull();
    });
  });
});
