import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [ChatroomsModule],
})
export class ChatModule {}
