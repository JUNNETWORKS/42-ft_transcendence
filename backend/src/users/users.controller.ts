import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import * as express from 'express';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PongService } from 'src/pong/pong.service';
import { pick } from 'src/utils';

import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly pongService: PongService
  ) {}

  @Get(':id/avatar')
  async getAvatar(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Param('id', ParseIntPipe) id: number
  ) {
    const { mime, avatar, lastModified } = await this.usersService.getAvatar(
      id
    );
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': mime,
      'Last-Modified': lastModified.toUTCString(),
    });
    const ifModifiedSince = req.header('If-Modified-Since');
    if (ifModifiedSince) {
      // Date はミリ秒単位だが, Last-Modified と If-Modified-Since は秒単位で, そのまま比べるとおかしくなるので
      // 秒単位に切り捨てる.
      const normalizedLastModified = new Date(
        Math.floor(lastModified.getTime() / 1000) * 1000
      );
      const dims = new Date(ifModifiedSince);
      if (dims >= normalizedLastModified) {
        res.status(304).send();
        return;
      }
    }
    avatar.getStream().pipe(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const u = await this.usersService.findOne(id);
    if (!u) {
      return null;
    }
    return pick(u, 'id', 'displayName');
  }

  @Get(':id/pong/results')
  getUserPongResults(@Param('id', ParseIntPipe) id: number) {
    return this.pongService.fetchUserMatchResults(id);
  }
}
