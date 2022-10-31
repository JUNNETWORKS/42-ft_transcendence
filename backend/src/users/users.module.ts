import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [PrismaModule, ChatroomsModule],
  exports: [UsersService],
})
export class UsersModule {}
