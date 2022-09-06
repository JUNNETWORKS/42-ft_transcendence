import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { resetTable } from '../src/prisma/testUtils';
import { CreateChatroomDto } from '../src/chatrooms/dto/createChatroom.dto';
import { ChatroomEntity } from 'src/chatrooms/entities/chatroom.entity';
import { UpdateRoomTypeDto } from 'src/chatrooms/dto/updateRoomType.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateRoomMemberDto } from 'src/chatrooms/dto/createRoomMember.dto';
import { RoomMemberDto } from 'src/chatrooms/dto/roomMember.dto';

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
    await resetTable(['ChatRoom']);

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

  it('PATCH /chatrooms/roomType 不要なパスワードをエラーとして判定', async () => {
    const body = {
      roomType: 'PRIVATE',
      roomPassword: 'testpass',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/roomType')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(400);
  });

  it('PATCH /chatrooms/roomType パスワードなしをエラーとして判定', async () => {
    const body = {
      roomType: 'LOCKED',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/roomType')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(400);
  });

  it('PATCH /chatrooms/roomType PUBLIC -> LOCKED', async () => {
    const body: UpdateRoomTypeDto = {
      roomType: 'LOCKED',
      roomPassword: 'testpass',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/roomType')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(200);
    expect(res.body.roomPassword).toEqual('testpass');
  });

  it('PATCH /chatrooms/roomType LOCKED -> PUBLIC', async () => {
    const body = {
      roomType: 'PUBLIC',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/2/roomType')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(200);
    expect(res.body.roomPassword).toEqual(null);
  });

  it('PATCH /chatrooms/roomName normal', async () => {
    const body = {
      roomName: 'new chatrooms name',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/2/roomName')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(200);
    expect(res.body.roomName).toEqual('new chatrooms name');
  });

  it('PATCH /chatrooms/roomName 重複エラー', async () => {
    const body = {
      roomName: 'public room',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/2/roomName')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(400);
  });

  it('PATCH /chatrooms/roomName validationエラー', async () => {
    const body = {
      roomName: null,
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/2/roomName')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(400);
  });

  it('PATCH /chatrooms/addMember', async () => {
    const body: CreateRoomMemberDto = {
      roomMember: [
        { userId: 2, memberType: 'MEMBER' },
        { userId: 3, memberType: 'OWNER' },
      ],
    };
    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/addMember')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(200);
  });

  it('PATCH /chatrooms/addMember useId validation', async () => {
    const body = {
      roomMember: [
        { userId: 3, memberType: 'OWNER' },
        { userId: 'hoge', memberType: 'MEMBER' },
      ],
    };
    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/addMember')
      .set('Accept', 'application/json')
      .send(body);

    expect(res.status).toEqual(400);
  });

  it('PATCH /chatrooms/memberType MEMBER -> ADMIN', async () => {
    const pbody: CreateRoomMemberDto = {
      roomMember: [
        { userId: 2, memberType: 'MEMBER' },
        { userId: 3, memberType: 'OWNER' },
      ],
    };
    await request(app.getHttpServer())
      .patch('/chatrooms/1/addMember')
      .set('Accept', 'application/json')
      .send(pbody);

    const body: RoomMemberDto = {
      userId: 2,
      memberType: 'ADMIN',
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/memberType')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(200);
    expect(res.body.memberType).toEqual('ADMIN');
    expect(res.body.endAt).toEqual(null);
  });

  it('PATCH /chatrooms/memberType MEMBER -> BANNED', async () => {
    const pbody: CreateRoomMemberDto = {
      roomMember: [{ userId: 2, memberType: 'MEMBER' }],
    };
    await request(app.getHttpServer())
      .patch('/chatrooms/1/addMember')
      .set('Accept', 'application/json')
      .send(pbody);

    const body: RoomMemberDto = {
      userId: 2,
      memberType: 'BANNED',
      endAt: new Date(),
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/memberType')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(200);
    expect(res.body.memberType).toEqual('BANNED');
    expect(res.body.endAt).not.toEqual(null);
  });

  it('PATCH /chatrooms/memberType BANNED -> MEMBER', async () => {
    const pbody: CreateRoomMemberDto = {
      roomMember: [{ userId: 2, memberType: 'MEMBER' }],
    };
    await request(app.getHttpServer())
      .patch('/chatrooms/1/addMember')
      .set('Accept', 'application/json')
      .send(pbody);

    const banned: RoomMemberDto = {
      userId: 2,
      memberType: 'BANNED',
      endAt: new Date(),
    };

    let res = await request(app.getHttpServer())
      .patch('/chatrooms/1/memberType')
      .set('Accept', 'application/json')
      .send(banned);
    expect(res.status).toEqual(200);
    expect(res.body.memberType).toEqual('BANNED');
    expect(res.body.endAt).not.toEqual(null);

    const toMember: RoomMemberDto = {
      userId: 2,
      memberType: 'MEMBER',
    };
    res = await request(app.getHttpServer())
      .patch('/chatrooms/1/memberType')
      .set('Accept', 'application/json')
      .send(toMember);
    expect(res.status).toEqual(200);
    expect(res.body.memberType).toEqual('MEMBER');
    expect(res.body.endAt).toEqual(null);
  });

  it('PATCH /chatrooms/memberType OWNERからの変更はエラー', async () => {
    const body: RoomMemberDto = {
      userId: 1,
      memberType: 'BANNED',
      endAt: new Date(),
    };

    const res = await request(app.getHttpServer())
      .patch('/chatrooms/1/memberType')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(400);
  });
});
