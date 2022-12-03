import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

import { PongService } from './pong.service';

@ApiTags('Pong')
@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {}

  @UseGuards(JwtAuthGuard)
  @Get('ranking')
  async getUserRanking() {
    return this.pongService.fetchUserRanking();
  }
}
