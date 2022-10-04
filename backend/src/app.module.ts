import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ChatroomsModule } from './chatrooms/chatrooms.module';
import { PongModule } from './pong/pong.module';
import { PongGateway } from './pong/pong.gateway';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, UsersModule, ChatroomsModule, AuthModule, PongModule],
  providers: [PongGateway],
})
export class AppModule {}
