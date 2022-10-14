import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FtAuthGuard } from './ft-auth.guard';
import { LoginResultEntity } from './entities/auth.entity';
import { UsersService } from 'src/users/users.service';
import * as Utils from 'src/utils';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  // TODO: 削除
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOkResponse({ type: LoginResultEntity })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async session(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    return Utils.pick(user!, 'id', 'displayName', 'email');
  }

  @UseGuards(FtAuthGuard)
  @Post('login_ft')
  @ApiFoundResponse({
    description: '認証のため42authにリダイレクトする.',
  })
  async login_ft(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(FtAuthGuard)
  @Get('callback_ft')
  @ApiOkResponse({
    type: LoginResultEntity,
    description: `42authでの認可コード発行後のリダイレクト先エンドポイント.\n認可コードがvalidなら, アクセストークンとユーザ情報を返す.`,
  })
  async callback_ft(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get('self/:id')
  @ApiFoundResponse({})
  async self(@Param('id', ParseIntPipe) id: number) {
    console.log('id', id);
    const user = await this.usersService.findOne(id);
    console.log('user', user);
    return this.authService.login(user!);
  }
}
