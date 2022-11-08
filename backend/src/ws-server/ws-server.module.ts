import { Module } from '@nestjs/common';
import { WsServerGateway } from './ws-server.gateway';

@Module({
  providers: [WsServerGateway],
  exports: [WsServerGateway],
})
export class WsServerModule {}
