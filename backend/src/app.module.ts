import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatroomsModule } from './chatrooms/chatrooms.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatroomsModule, AuthModule],
})
export class AppModule {}
