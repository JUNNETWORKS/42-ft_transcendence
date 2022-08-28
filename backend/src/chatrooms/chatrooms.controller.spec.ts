import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';

describe('ChatroomsController', () => {
  let controller: ChatroomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatroomsController],
      providers: [ChatroomsService],
    }).compile();

    controller = module.get<ChatroomsController>(ChatroomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
