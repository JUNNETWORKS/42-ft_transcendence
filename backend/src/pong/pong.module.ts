import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { WsServerModule } from 'src/ws-server/ws-server.module';

import { PrismaModule } from '../prisma/prisma.module';
import { PostMatchStrategy } from './game/PostMatchStrategy';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  providers: [PongService, PongGateway, PostMatchStrategy],
  controllers: [PongController],
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    WsServerModule,
    forwardRef(() => UsersModule),
  ],
  exports: [PongService],
})
export class PongModule {}
