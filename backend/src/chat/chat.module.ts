import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatroomsModule } from '../chatrooms/chatrooms.module';
import { UsersModule } from '../users/users.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [ChatGateway, ChatService, JwtService],
  imports: [ChatroomsModule, UsersModule],
})
export class ChatModule {}
