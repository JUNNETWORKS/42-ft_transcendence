import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { ChatMessageEntity } from 'src/chatrooms/entities/chat-message.entity';
import { ChatUserRelationEntity } from 'src/chatrooms/entities/chat-user-relation.entity';
import { ChatroomEntity } from 'src/chatrooms/entities/chatroom.entity';
import { hash_password } from 'src/users/users.service';

import { CreateRoomMemberDto } from 'src/chatrooms/dto/create-room-member.dto';
import { PostMessageDto } from 'src/chatrooms/dto/post-message.dto';
import { RoomMemberDto } from 'src/chatrooms/dto/room-member.dto';
import { UpdateRoomDto } from 'src/chatrooms/dto/update-room.dto';

import { CreateChatroomDto } from '../src/chatrooms/dto/create-chatroom.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';
import { createRooms, postMessages, resetTable } from './testUtils';

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

  // 要: 認証情報
  // describe('POST /chatrooms', () => {
  //   it('success', async () => {
  //     const body: CreateChatroomDto = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC',
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'ADMIN' }],
  //     };
  //     const res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(201);

  //     expect(res.body.roomName).toEqual(body.roomName);
  //   });

  //   it('ownerがmemberに含まれない時エラー', async () => {
  //     const body: CreateChatroomDto = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC',
  //       ownerId: 1,
  //       roomMember: [{ userId: 2, memberType: 'MEMBER' }],
  //     };
  //     const res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);
  //   });

  //   it('ownerがADMINでないときエラー', async () => {
  //     const body: CreateChatroomDto = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC',
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'MEMBER' }],
  //     };
  //     const res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);
  //   });

  //   it('roomName validation', async () => {
  //     const body = {
  //       roomName: 'testroom' as any,
  //       roomType: 'PUBLIC',
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'ADMIN' }],
  //     };

  //     let res;

  //     body.roomName = '';
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomName =
  //       'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomName = 10;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     delete body.roomName;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);
  //   });

  //   it('roomType validation', async () => {
  //     const body = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC' as any,
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'ADMIN' }],
  //     };

  //     let res;

  //     body.roomType = 'NO_SUCH_VAL';
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     delete body.roomType;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);
  //   });

  //   it('roomPassword validation', async () => {
  //     const body = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC',
  //       roomPassword: 'string' as any,
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'ADMIN' }],
  //     };

  //     let res;

  //     body.roomPassword = 10;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomPassword = 'testpass';
  //     body.roomType = 'PUBLIC';
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     delete body.roomPassword;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(201);

  //     body.roomType = 'LOCKED';
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);
  //   });

  //   it('roomMember validation', async () => {
  //     const body = {
  //       roomName: 'testroom',
  //       roomType: 'PUBLIC',
  //       ownerId: 1,
  //       roomMember: [{ userId: 1, memberType: 'ADMIN' }] as any,
  //     };

  //     let res;

  //     body.roomMember = [10];
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomMember = [{ userId: 1, memberType: 'ADMIN' }, 10];
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     delete body.roomMember;
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomMember = [
  //       { userId: 1, memberType: 'MEMBER' },
  //       { userId: 2, memberType: 'NOSUCH' },
  //     ];
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomMember = [
  //       { userId: 1, memberType: 'MEMBER' },
  //       { userId: 2, memberType: 'BANNED' },
  //     ];
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(400);

  //     body.roomMember = [
  //       { userId: 1, memberType: 'ADMIN' },
  //       { userId: 2, memberType: 'ADMIN' },
  //     ];
  //     res = await request(app.getHttpServer())
  //       .post('/chatrooms')
  //       .set('Accept', 'application/json')
  //       .send(body);
  //     expect(res.status).toEqual(201);
  //   });
  // });

  describe('DELETE /chatrooms/{id}', () => {
    it('success', async () => {
      const res = await request(app.getHttpServer())
        .delete('/chatrooms/1')
        .set('Accept', 'application/json');
      expect(res.status).toEqual(200);

      // res = await request(app.getHttpServer())
      //   .get('/chatrooms/1')
      //   .set('Accept', 'application/json');
      // expect(res.status).toEqual(400);
    });
  });
});
