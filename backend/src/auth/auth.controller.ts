import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { FtAuthGuard } from './ft-auth.guard';
import { LoginResultEntity } from './entities/auth.entity';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: 削除
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOkResponse({ type: LoginResultEntity })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  async protected(@Request() req: any) {
    return req.user;
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
}
