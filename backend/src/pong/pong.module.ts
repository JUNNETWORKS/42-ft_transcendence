import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [PongService, PongGateway],
  controllers: [PongController],
  imports: [PrismaModule],
})
export class PongModule {}
