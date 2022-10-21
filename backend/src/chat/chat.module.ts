import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatroomsModule } from '../chatrooms/chatrooms.module';
import { UsersModule } from '../users/users.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [ChatGateway, ChatService, JwtService],
  imports: [ChatroomsModule, UsersModule, AuthModule],
})
export class ChatModule {}
