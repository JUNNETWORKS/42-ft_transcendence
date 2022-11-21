import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
  UseFilters,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebSocketGateway } from '@nestjs/websockets';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import * as Utils from 'src/utils';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { UpdateUserNameDto } from './dto/update-user-name.dto';

import { UsersService } from './users.service';

@Controller('me')
@ApiTags('me')
@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly wsServer: WsServerGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('')
  async get(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    return Utils.pick(user!, 'id', 'displayName', 'email');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('')
  @UseFilters(PrismaExceptionFilter)
  async patch(@Request() req: any, @Body() updateUserDto: UpdateUserNameDto) {
    const id = req.user.id;
    // displayName の唯一性チェック
    // -> unique 制約に任せる
    const result = await this.usersService.update(id, updateUserDto);
    this.wsServer.sendResults(
      'ft_user',
      {
        action: 'update',
        id,
        data: { ...updateUserDto },
      },
      { global: 'global' }
    );
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('twoFa/enable')
  @UseFilters(PrismaExceptionFilter)
  async enableTwoFa(@Request() req: any) {
    const id = req.user.id;
    const qrcode = await this.usersService.enableTwoFa(id);
    return { qrcode };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('twoFa/disable')
  @UseFilters(PrismaExceptionFilter)
  async disableTwoFa(@Request() req: any) {
    const id = req.user.id;
    return this.usersService.disableTwoFa(id);
  }
}
