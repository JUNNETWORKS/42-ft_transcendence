import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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

  it('dummy test', () => {
    expect(true).toBeTruthy();
  });
});
