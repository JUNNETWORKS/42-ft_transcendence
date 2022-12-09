import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { Socket } from 'socket.io';

import { verifyOtpDto } from './dto/verify-otp.dto';

import { PrismaService } from '../prisma/prisma.service';
import { UserMinimum } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import * as Utils from '../utils';
import { jwtConstants } from './auth.constants';

import { randomUUID } from 'crypto';

export type LoginResult = {
  access_token: string;
  user?: any;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async validateUser(email: string, password: string) {
    console.log(email, password);
    const user = await this.usersService.findByEmail(email);
    console.log(user);
    if (user) {
      const hashed = UsersService.hash_password(password);
      if (user.password === hashed) {
        console.log('succeeded');
        return [true, user] as const;
      }
      console.log('FAIL');
      return [false, user] as const;
    }
    return [false, null] as const;
  }

  /**
   * 与えられた`intraId`を持つユーザがいればそれを取得して返す.
   * いなければ登録して返す.
   * @returns Promise\<User\>
   */
  async retrieveUser(
    intraId: number,
    data: Pick<UserMinimum, 'displayName' | 'email'>
  ) {
    const user = await this.usersService.findByIntraId(intraId);
    if (user) {
      // ユーザがいた -> そのまま返す
      return { user, created: false };
    }
    // ユーザがいない -> ユーザを登録
    // MEMO: ユニーク制約が破られた時には PrismaClientKnownRequestError が飛んでくる
    data.displayName = await this.usersService.findUniqueNameByPrefix(
      data.displayName
    );
    const createdUser = await this.usersService.create({
      intraId,
      ...data,
      password: UsersService.hash_password(randomUUID()),
    });
    return { user: createdUser, created: true };
  }

  async login(user: any, completedTwoFa = false): Promise<LoginResult> {
    const iat = Date.now() / 1000;
    const u = await this.usersService.findOne(user.id);
    if (u?.isEnabled2FA && !completedTwoFa) {
      const secretId = await this.prisma.totpSecret.findUnique({
        where: {
          userId: user.id,
        },
      });
      const result = {
        required2fa: true,
        access_token: this.issueAccessToken(user, {
          secretId: secretId?.id,
          next: 'totp',
          iat,
        }),
      };
      return result;
    }
    const result = {
      access_token: this.issueAccessToken(user),
      user: {
        ...Utils.pick(
          u!,
          'id',
          'displayName',
          'email',
          'isEnabled2FA',
          'isEnabledAvatar'
        ),
        created: !!user.created,
      },
    };
    return result;
  }

  async trapAuth(client: Socket) {
    if (client.handshake.auth) {
      const { token } = client.handshake.auth;
      // token による認証
      if (token) {
        const verified = this.jwtService.verify(token, {
          secret: jwtConstants.secret,
        });
        // console.log(verified);
        const decoded = this.jwtService.decode(token);
        if (decoded && typeof decoded === 'object') {
          const sub = decoded['sub'];
          if (sub) {
            const userId = parseInt(sub);
            const user = await this.usersService.findOne(userId);
            if (user) {
              return user;
            }
          }
        }
      }
    }
    return null;
  }

  async generateQrCode(userId: number, secret: string) {
    const otpPath = authenticator.keyuri(userId.toString(), 'tra', secret);
    return await toDataURL(otpPath);
  }

  async verifyOtp(secretId: number, verifyOtpDto: verifyOtpDto) {
    const secret = await this.prisma.totpSecret.findFirst({
      where: {
        id: secretId,
      },
    });
    if (!secret) {
      return false;
    }
    const isValid = authenticator.check(verifyOtpDto.otp, secret.secret);
    return isValid;
  }

  issueAccessToken(user: User, payload: any = null) {
    console.log(user);
    if (user.lockUntil && new Date() < user.lockUntil) {
      console.log(`USER ${user.id} IS NOW LOCKED!!`);
      throw new UnauthorizedException();
    }
    const actualPayload = payload || {
      email: user.email,
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
    };
    return this.jwtService.sign(actualPayload, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
  }
}
