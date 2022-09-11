import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PongModule } from './pong/pong.module';
import { PongGateway } from './pong.gateway';
import { PongGateway } from './pong.gateway';

@Module({
  imports: [PrismaModule, UsersModule, PongModule],
  providers: [PongGateway],
})
export class AppModule {}
