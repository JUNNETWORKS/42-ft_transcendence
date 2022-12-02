import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ChatModule } from 'src/chat/chat.module';
import { WsServerModule } from 'src/ws-server/ws-server.module';

import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';

@Module({
  controllers: [ChatroomsController],
  providers: [ChatroomsService],
  imports: [
    PrismaModule,
    JwtModule,
    forwardRef(() => ChatModule),
    WsServerModule,
  ],
  exports: [ChatroomsService],
})
export class ChatroomsModule {}
