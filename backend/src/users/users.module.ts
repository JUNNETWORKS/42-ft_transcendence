import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from 'src/auth/auth.module';
import { ChatModule } from 'src/chat/chat.module';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';
import { WsServerModule } from 'src/ws-server/ws-server.module';

import { PrismaModule } from '../prisma/prisma.module';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService],
  imports: [
    PrismaModule,
    ChatroomsModule,
    JwtModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ChatModule),
    WsServerModule,
  ],
  exports: [UsersService],
})
export class UsersModule {}
