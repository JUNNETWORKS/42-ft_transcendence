import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';

describe('ChatroomsController', () => {
  let controller: ChatroomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatroomsController],
      providers: [ChatroomsService, PrismaService],
    }).compile();

    controller = module.get<ChatroomsController>(ChatroomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
