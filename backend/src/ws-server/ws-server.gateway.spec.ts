import { Test, TestingModule } from '@nestjs/testing';
import { WsServerGateway } from './ws-server.gateway';

describe('WsServerGateway', () => {
  let gateway: WsServerGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WsServerGateway],
    }).compile();

    gateway = module.get<WsServerGateway>(WsServerGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
