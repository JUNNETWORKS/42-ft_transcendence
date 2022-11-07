import { Module } from '@nestjs/common';
import { WsServerGateway } from './ws-server.gateway';
import { WsServerService } from './ws-server.service';

@Module({
  providers: [WsServerGateway, WsServerService],
  exports: [WsServerService],
})
export class WsServerModule {}
