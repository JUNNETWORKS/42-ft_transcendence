import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
  UseFilters,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChatGateway } from 'src/chat/chat.gateway';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import * as Utils from 'src/utils';

import { UpdateMeDto } from './dto/update-me.dto';

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
  async patch(@Request() req: any, @Body() updateUserDto: UpdateMeDto) {
    const id = req.user.id;
    // displayName の唯一性チェック
    // -> unique 制約に任せる
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new BadRequestException('no user');
    }
    const isEnabledAvatar = !!updateUserDto.avatar || user.isEnabledAvatar;
    const ordinary = this.usersService.update(id, {
      ...Utils.pick(updateUserDto, 'displayName'),
      isEnabledAvatar,
    });
    const avatar = updateUserDto.avatar
      ? this.usersService.upsertAvatar(id, updateUserDto.avatar)
      : Promise.resolve('skipped');
    const result = await Utils.PromiseMap({ ordinary, avatar });
    this.chatGateway.sendResults(
      'ft_user',
      {
        action: 'update',
        id,
        data: { ...updateUserDto },
      },
      { global: 'global' }
    );
    return Utils.pick(
      result.ordinary,
      'id',
      'displayName',
      'isEnabled2FA',
      'isEnabledAvatar'
    );
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
