import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';
import { JwtModule } from '@nestjs/jwt';
import { MeController } from './me.controller';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService],
  imports: [
    PrismaModule,
    ChatroomsModule,
    JwtModule,
    forwardRef(() => ChatModule),
  ],
  exports: [UsersService],
})
export class UsersModule {}
