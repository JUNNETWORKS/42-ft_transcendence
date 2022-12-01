import { forwardRef, Module } from '@nestjs/common';

import { ChatModule } from 'src/chat/chat.module';

import { WsServerGateway } from './ws-server.gateway';

@Module({
  providers: [WsServerGateway],
  imports: [forwardRef(() => ChatModule)],
  exports: [WsServerGateway],
})
export class WsServerModule {}
