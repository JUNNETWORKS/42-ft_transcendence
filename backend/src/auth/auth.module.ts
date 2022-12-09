import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { jwtConstants } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthLocker } from './auth.locker';
import { AuthService } from './auth.service';
import { FtStrategy } from './ft.strategy';
import { JwtTotpStrategy } from './jwt-totp.strategy';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { WsJwtStrategy } from './ws-jst.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    WsJwtStrategy,
    FtStrategy,
    JwtTotpStrategy,
    AuthLocker,
  ],
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '30d' },
    }),
    PrismaModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
