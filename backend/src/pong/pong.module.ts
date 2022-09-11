import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';

@Module({
  providers: [PongService],
  controllers: [PongController],
})
export class PongModule {}
