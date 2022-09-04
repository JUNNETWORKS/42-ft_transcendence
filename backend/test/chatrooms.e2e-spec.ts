import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { resetTable } from '../src/prisma/testUtils';
import { CreateChatroomDto } from '../src/chatrooms/dto/createChatroom.dto';
import { ChatroomEntity } from 'src/chatrooms/entities/chatroom.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await resetTable(['ChatRoom']);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // seeding some rooms
    let body: CreateChatroomDto;
    let res;

    body = {
      roomName: 'public room',
      roomType: 'PUBLIC',
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
    };
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);

    body = {
      roomName: 'locked room',
      roomType: 'LOCKED',
      roomPassword: 'tetpass',
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
    };
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);

    body = {
      roomName: 'private room',
      roomType: 'PRIVATE',
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
    };
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);
  });

  it('POST /chatrooms', async () => {
    const body: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
    };
    const res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);

    expect(res.body.roomName).toEqual(body.roomName);
  });

  it('POST /chatrooms roomName validation', async () => {
    const body = {
      roomName: 'testroom' as any,
      roomType: 'PUBLIC',
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
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

  it('POST /chatrooms roomType validation', async () => {
    const body = {
      roomName: 'testroom',
      roomType: 'PUBLIC' as any,
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
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

  it('POST /chatrooms roomPassword validation', async () => {
    const body = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomPassword: 'string' as any,
      roomMember: [{ userId: 1, memberType: 'OWNER' }],
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

  it('POST /chatrooms roomMember validation', async () => {
    const body = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomMember: [{ userId: 1, memberType: 'OWNER' }] as any,
    };

    let res;

    body.roomMember = [10];
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(400);

    body.roomMember = [{ userId: 1, memberType: 'OWNER' }, 10];
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
      { userId: 1, memberType: 'OWNER' },
      { userId: 2, memberType: 'NOSUCH' },
    ];
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(400);

    body.roomMember = [
      { userId: 1, memberType: 'OWNER' },
      { userId: 2, memberType: 'BANNED' },
    ];
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(400);

    body.roomMember = [
      { userId: 1, memberType: 'OWNER' },
      { userId: 2, memberType: 'ADMIN' },
    ];
    res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);
  });

  it('GET /chatrooms privateなチャットルームを取得しない', async () => {
    const res = await request(app.getHttpServer())
      .get('/chatrooms')
      .set('Accept', 'application/json');

    expect(res.status).toEqual(200);
    const response: ChatroomEntity[] = res.body;
    expect(response.length).toEqual(2);
    response.forEach((chatRoom) => {
      expect(chatRoom.roomType).not.toEqual('PRIVATE');
    });
  });
});
