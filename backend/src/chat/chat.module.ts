import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { ChatroomsModule } from '../chatrooms/chatrooms.module';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [
    ChatroomsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
