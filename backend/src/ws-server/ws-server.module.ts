import { forwardRef, Module } from '@nestjs/common';

import { ChatModule } from 'src/chat/chat.module';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';

import { WsServerGateway } from './ws-server.gateway';

@Module({
  providers: [WsServerGateway],
  imports: [forwardRef(() => ChatModule), forwardRef(() => ChatroomsModule)],
  exports: [WsServerGateway],
})
export class WsServerModule {}
