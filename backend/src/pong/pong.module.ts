import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { PrismaModule } from '../prisma/prisma.module';
import { PostMatchStrategy } from './game/PostMatchStrategy';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  controllers: [PongController],
  providers: [PongService, PongGateway, PostMatchStrategy],
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  exports: [PongService],
})
export class PongModule {}
