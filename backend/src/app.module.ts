import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatroomsModule } from './chatrooms/chatrooms.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatroomsModule, AuthModule, ChatModule],
})
export class AppModule {}
