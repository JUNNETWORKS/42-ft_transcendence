import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatroomsModule } from '../chatrooms/chatrooms.module';
import { UsersModule } from '../users/users.module';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [ChatroomsModule, UsersModule],
})
export class ChatModule {}
