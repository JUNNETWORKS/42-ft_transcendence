import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsController } from './chatrooms.controller';
import { ChatroomsService } from './chatrooms.service';

@Module({
  controllers: [ChatroomsController],
  providers: [ChatroomsService],
  imports: [PrismaModule],
  exports: [ChatroomsService],
})
export class ChatroomsModule {}
