import { Module } from '@nestjs/common';
import { WsServerGateway } from './ws-server.gateway';

@Module({
  providers: [WsServerGateway],
})
export class WsServerModule {}
