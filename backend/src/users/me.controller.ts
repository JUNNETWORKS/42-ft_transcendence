import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserNameDto } from './dto/update-user-name.dto';
import { Prisma } from '@prisma/client';
import * as Utils from 'src/utils';

@Controller('me')
@ApiTags('me')
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('')
  async get(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    return Utils.pick(user!, 'id', 'displayName', 'email');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('')
  async patch(@Request() req: any, @Body() updateUserDto: UpdateUserNameDto) {
    try {
      const id = req.user.id;
      // displayName の唯一性チェック
      // -> unique 制約に任せる
      const result = await this.usersService.update(id, updateUserDto);
      return result;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // e.code === "P2002" is Uniq Violation
        if (e.code === 'P2002') {
          // e.meta.target にはユニーク制約違反したフィールド名が配列で入る
          if (e.meta) {
            // { [フィールド名]: "not_unique" } というmapを作って返す
            const errorMap = Utils.mapValues(
              Utils.keyBy(e.meta.target as string[], (t) => t),
              () => 'not_unique'
            );
            throw new HttpException(errorMap, 400);
          }
          throw new HttpException('not_unique', 400);
        }
      }
      throw e;
    }
  }
}
