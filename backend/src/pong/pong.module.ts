import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongGateway } from './pong.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [PongService, PongGateway],
  imports: [PrismaModule, AuthModule],
})
export class PongModule {}
