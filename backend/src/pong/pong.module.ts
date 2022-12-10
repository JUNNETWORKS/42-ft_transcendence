import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { WsServerModule } from 'src/ws-server/ws-server.module';

import { PrismaModule } from '../prisma/prisma.module';
import { PostMatchStrategy } from './game/PostMatchStrategy';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  providers: [PongService, PongGateway, PostMatchStrategy],
  controllers: [PongController],
  imports: [PrismaModule, AuthModule, WsServerModule],
})
export class PongModule {}
