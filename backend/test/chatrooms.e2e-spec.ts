import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { resetTable } from '../src/prisma/testUtils';
import { CreateChatroomDto } from '../src/chatrooms/dto/create-chatroom.dto';

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
  });

  it('ルーム作成', async () => {
    const body: CreateChatroomDto = {
      roomName: 'testroom',
      roomType: 'PUBLIC',
      roomPassword: 'string',
      members: [{ userId: 1, userType: 'OWNER' }],
    };
    const res = await request(app.getHttpServer())
      .post('/chatrooms')
      .set('Accept', 'application/json')
      .send(body);
    expect(res.status).toEqual(201);

    expect(res.body.roomName).toEqual(body.roomName);
  });

  it('ルーム作成 roomName validation', async () => {
    const body = {
      roomName: 'testroom' as any,
      roomType: 'PUBLIC',
      roomPassword: 'string',
      members: [{ userId: 1, userType: 'OWNER' }],
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

  it('ルーム作成 roomType validation', async () => {
    const body = {
      roomName: 'testroom',
      roomType: 'PUBLIC' as any,
      roomPassword: 'string',
      members: [{ userId: 1, userType: 'OWNER' }],
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
});
