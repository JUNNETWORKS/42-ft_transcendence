import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
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
});
