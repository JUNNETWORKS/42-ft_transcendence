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

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from 'src/chat/chat.gateway';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import * as Utils from 'src/utils';

import { UpdateUserNameDto } from './dto/update-user-name.dto';

import { UsersService } from './users.service';

@Controller('me')
@ApiTags('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly chatGateway: ChatGateway
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
    this.chatGateway.sendResults(
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
}
