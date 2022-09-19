import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatroomsModule } from './chatrooms/chatrooms.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatroomsModule],
})
export class AppModule {}
