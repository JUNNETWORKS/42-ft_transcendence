import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsService } from './chatrooms.service';

describe('ChatroomsService', () => {
  let service: ChatroomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatroomsService],
    }).compile();

    service = module.get<ChatroomsService>(ChatroomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
