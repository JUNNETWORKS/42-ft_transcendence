import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  HttpException,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import * as Utils from 'src/utils';

import { verifyOtpDto } from './dto/verify-opt.dto';

import { AuthLocker } from './auth.locker';
import { AuthService } from './auth.service';
import { LoginResultEntity } from './entities/auth.entity';
import { FtAuthGuard } from './ft-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTotpAuthGuard } from './jwt-totp-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly locker: AuthLocker
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOkResponse({ type: LoginResultEntity })
  async loginByPassword(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async session(@Request() req: any) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new HttpException('No User', 401);
    }
    return Utils.pick(
      user,
      'id',
      'displayName',
      'email',
      'isEnabled2FA',
      'isEnabledAvatar'
    );
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
  async loginbySelf(@Param('id', ParseIntPipe) id: number) {
    console.log('id', id);
    const user = await this.usersService.findOne(id);
    console.log('user', user);
    return this.authService.login(user!);
  }

  @UseGuards(JwtTotpAuthGuard)
  @Post('otp')
  async verifyOtp(@Request() req: any, @Body() dto: verifyOtpDto) {
    console.log('req.user', req.user);
    const { isValid, topt: totp } = await Utils.PromiseMap({
      isValid: this.authService.verifyOtp(req.user.secretId, dto),
      topt: this.prisma.totpSecret.findUnique({
        where: {
          id: req.user.secretId,
        },
      }),
    });
    if (!isValid) {
      if (totp) {
        await this.locker.markFailure(totp.userId);
      }
      throw new UnauthorizedException();
    }
    if (!totp) {
      throw new BadRequestException();
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: totp.userId,
      },
    });
    return this.authService.login(user, true);
  }
}
