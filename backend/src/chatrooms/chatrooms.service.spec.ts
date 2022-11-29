import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ChatroomsService } from './chatrooms.service';

describe('ChatroomsService', () => {
  let service: ChatroomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatroomsService, PrismaService],
    }).compile();

    service = module.get<ChatroomsService>(ChatroomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
