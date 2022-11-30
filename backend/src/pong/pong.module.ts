import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  providers: [PongService, PongGateway],
  controllers: [PongController],
  imports: [PrismaModule],
})
export class PongModule {}
