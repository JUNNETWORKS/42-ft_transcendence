import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
  UseFilters,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebSocketGateway } from '@nestjs/websockets';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaExceptionFilter } from 'src/filters/prisma-exception.filter';
import * as Utils from 'src/utils';
import { WsServerGateway } from 'src/ws-server/ws-server.gateway';

import { UpdateMePasswordDto } from './dto/update-me-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';

import { UpdatePasswordPipe } from './pipe/update-password.pipe';
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

  // GET /me
  @UseGuards(JwtAuthGuard)
  @Get('')
  async get(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new BadRequestException('no user');
    }
    return Utils.pick(user, 'id', 'displayName', 'email');
  }

  // PATCH /me
  @UseGuards(JwtAuthGuard)
  @Patch('')
  @UseFilters(PrismaExceptionFilter)
  async patch(@Request() req: any, @Body() updateMeDto: UpdateMeDto) {
    const id = req.user.id;
    // displayName の唯一性チェック
    // -> unique 制約に任せる
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new BadRequestException('no user');
    }
    // [DB保存]
    // TODO: こここそトランザクションなんじゃないの
    const isEnabledAvatar = !!updateMeDto.avatar || user.isEnabledAvatar;
    // 本体
    const ordinary = this.usersService.update(id, {
      ...Utils.pick(updateMeDto, 'displayName', 'password'),
      isEnabledAvatar,
    });
    // アバター
    const avatar = updateMeDto.avatar
      ? this.usersService.upsertAvatar(id, updateMeDto.avatar)
      : Promise.resolve('skipped');
    // [後処理]
    const result = await Utils.PromiseMap({ ordinary, avatar });
    {
      const data = {
        ...Utils.omit(updateMeDto, 'avatar'),
        ...(updateMeDto.avatar ? { avatar: true } : {}),
      };
      this.wsServer.sendResults(
        'ft_user',
        {
          action: 'update',
          id,
          data,
        },
        { global: 'global' }
      );
    }
    // TODO: パスワードが変更されているなら, このユーザのすべてのJWTを失効させる
    // TODO: さらに, 新しいアクセストークンを返す
    return {
      user: Utils.pick(
        result.ordinary.user,
        'id',
        'displayName',
        'isEnabled2FA',
        'isEnabledAvatar'
      ),
    };
  }

  // PATCH /me/password
  @UseGuards(JwtAuthGuard)
  @Patch('/password')
  @UseFilters(PrismaExceptionFilter)
  async patchPassword(
    @Request() req: any,
    @Body(new UpdatePasswordPipe()) updateMePasswordDto: UpdateMePasswordDto
  ) {
    const id = req.user.id;
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new BadRequestException('no user');
    }
    await this.usersService.update(id, updateMePasswordDto);
    // TODO: このユーザのすべてのJWTを失効させる
    // TODO: 新しいアクセストークンを返す
    return { status: 'ok' };
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
