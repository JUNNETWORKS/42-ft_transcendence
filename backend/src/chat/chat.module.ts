import { WsServerModule } from './../ws-server/ws-server.module';
import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatroomsModule } from '../chatrooms/chatrooms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [ChatroomsModule, UsersModule, AuthModule, WsServerModule],
})
export class ChatModule {}
