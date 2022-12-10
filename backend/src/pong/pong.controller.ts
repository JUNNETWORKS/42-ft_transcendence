import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard)
  @Get('matches/:matchId')
  async spectateByMatchId(
    @Request() req: any,
    @Param('matchId') matchId: string
  ) {
    return this.pongService.spectateByMatchID(req.user.id, matchId);
  }
}
