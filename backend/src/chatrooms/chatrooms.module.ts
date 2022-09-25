import { Module } from '@nestjs/common';
import { ChatroomsService } from './chatrooms.service';
import { ChatroomsController } from './chatrooms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChatroomsController],
  providers: [ChatroomsService, ChatGateway],
  imports: [PrismaModule],
})
export class ChatroomsModule {}
