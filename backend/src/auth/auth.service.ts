import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { Socket } from 'socket.io';

import { verifyOtpDto } from './dto/verify-otp.dto';

import { PrismaService } from '../prisma/prisma.service';
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
  async retrieveUser(displayName: string, email: string, intraId: number) {
    // https://github.com/JUNNETWORKS/42-ft_transcendence/issues/334
    const existedUser = await Utils.PromiseMap({
      byIntraId: this.usersService.findByIntraId(intraId),
      byEmail: this.usersService.findByEmail(email),
    });
    if (existedUser.byEmail && existedUser.byIntraId) {
      if (existedUser.byEmail.id === existedUser.byIntraId.id) {
        // 3. 見つかったユーザでログインする
        return { user: existedUser.byEmail, created: false };
      }
    }
    if (existedUser.byEmail && !existedUser.byIntraId) {
      if (!existedUser.byEmail.intraId) {
        // 2. 見つかったユーザに intraId を与えてログイン ※ intraId以外のデータは取らない
        const { user } = await this.usersService.update(
          existedUser.byEmail.id,
          {
            intraId,
          }
        );
        return { user, created: false };
      }
    }
    if (!existedUser.byEmail && !existedUser.byIntraId) {
      // email, intraIdが等しい ユーザがいない -> 1. ユーザを登録
      // MEMO: ユニーク制約が破られた時には PrismaClientKnownRequestError が飛んでくる
      const newDisplayName = await this.usersService.findUniqueNameByPrefix(
        displayName
      );
      const createdUser = await this.usersService.create({
        intraId,
        email,
        displayName: newDisplayName,
        password: UsersService.hash_password(randomUUID()),
      });
      return { user: createdUser, created: true };
    }
    throw new InternalServerErrorException('data error');
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
    return this.issueUser(u!, !!user.created);
  }

  async trapAuth(client: Socket) {
    try {
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
    } catch (e) {
      console.error(e);
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

  issueUser(user: User, untouched: boolean) {
    return {
      access_token: this.issueAccessToken(user),
      user: {
        ...Utils.pick(
          user,
          'id',
          'displayName',
          'email',
          'isEnabled2FA',
          'isEnabledAvatar'
        ),
        created: untouched,
      },
    };
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
