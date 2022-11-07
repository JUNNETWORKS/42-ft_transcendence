import { Test, TestingModule } from '@nestjs/testing';
import { WsServerService } from './ws-server.service';

describe('WsServerService', () => {
  let service: WsServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsServerService],
    }).compile();

    service = module.get<WsServerService>(WsServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
