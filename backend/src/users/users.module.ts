import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsModule } from 'src/chatrooms/chatrooms.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/auth.constants';
import { MeController } from './me.controller';

@Module({
  controllers: [UsersController, MeController],
  providers: [UsersService],
  imports: [PrismaModule, ChatroomsModule, JwtModule],
  exports: [UsersService],
})
export class UsersModule {}
