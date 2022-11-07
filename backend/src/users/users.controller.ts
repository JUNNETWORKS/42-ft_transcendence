import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseFilters,
  Res,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PrismaExceptionFilter } from 'src/filters/prisma';
import * as express from 'express';
import * as dayjs from 'dayjs';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: 削除
  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findAll() {
    return this.usersService.findAll();
  }

  // @UseGuards(JwtAuthGuard)
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

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // TODO: intraId は変更できないようにする
  @Patch(':id')
  @ApiOkResponse({ type: UserEntity })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserEntity })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
