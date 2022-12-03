import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';

import { PrismaModule } from '../prisma/prisma.module';
import { PongController } from './pong.controller';
import { PongGateway } from './pong.gateway';
import { PongService } from './pong.service';

@Module({
  controllers: [PongController],
  providers: [PongService, PongGateway],
  imports: [PrismaModule, AuthModule],
})
export class PongModule {}
