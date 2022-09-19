import { Module } from '@nestjs/common';
import { ChatroomsService } from './chatrooms.service';
import { ChatroomsController } from './chatrooms.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ChatroomsController],
  providers: [ChatroomsService],
  imports: [PrismaModule],
})
export class ChatroomsModule {}
