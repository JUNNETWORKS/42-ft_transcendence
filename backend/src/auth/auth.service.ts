import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { hash_password, UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMinimum } from '../users/entities/user.entity';
import { jwtConstants } from './auth.constants';
import { Socket } from 'socket.io';
import * as Utils from '../utils';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { verifyOtpDto } from './dto/verify-opt.dto';
import { PrismaService } from '../prisma/prisma.service';

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

  async validateUser(email: string, password: string): Promise<any> {
    console.log(email, password);
    const user = await this.usersService.findByEmail(email);
    console.log(user);
    if (user) {
      const hashed = hash_password(password);
      if (user.password === hashed) {
        console.log('succeeded');
        return user;
      }
      console.log('FAIL');
    }
    return null;
  }

  /**
   * 与えられた`intraId`を持つユーザがいればそれを取得して返す.
   * いなければ登録して返す.
   * @returns Promise\<User\>
   */
  async retrieveUser(
    intraId: number,
    data: Omit<UserMinimum, 'intraId' | 'password' | 'isEnabled2FA'>
  ) {
    const user = await this.usersService.findByIntraId(intraId);
    if (user) {
      // ユーザがいた -> そのまま返す
      return user;
    }
    // ユーザがいない -> ユーザを登録
    // MEMO: ユニーク制約が破られた時には PrismaClientKnownRequestError が飛んでくる
    data.displayName = await this.usersService.findUniqueNameByPrefix(
      data.displayName
    );
    const createdUser = await this.usersService.create({
      intraId,
      ...data,
      password: '',
    });
    return createdUser;
  }

  async login(user: any): Promise<LoginResult> {
    const iat = Date.now() / 1000;
    const payload = {
      email: user.email,
      sub: user.id,
      iat,
    };
    const u = await this.usersService.findOne(user.id);
    if (u?.isEnabled2FA) {
      const secretId = await this.prisma.totpSecret.findUnique({
        where: {
          userId: user.id,
        },
      });
      const result = {
        required2fa: true,
        access_token: this.jwtService.sign(
          { secretId: secretId?.id, next: 'totp', iat },
          {
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
          }
        ),
      };
      return result;
    }
    const result = {
      access_token: this.jwtService.sign(payload, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      }),
      user: Utils.pick(u!, 'id', 'displayName', 'email'),
    };
    console.log(`[login]`, result);
    return result;
  }

  async trapAuth(client: Socket) {
    if (client.handshake.auth) {
      const { token, sub } = client.handshake.auth;
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
      // subによる認証スキップ
      // TODO: 提出時には絶対に除去すること!!!!
      if (sub) {
        const userId = parseInt(sub);
        const user = await this.usersService.findOne(userId);
        if (user) {
          return user;
        }
      }
    }
    return null;
  }

  async generateQrCode(userId: number, secret: string) {
    const otpPath = authenticator.keyuri(userId.toString(), 'tra', secret);
    return await toDataURL(otpPath);
  }

  async verifyOtp(verifyOtpDto: verifyOtpDto) {
    const secret = await this.prisma.totpSecret.findFirst({
      where: {
        userId: verifyOtpDto.userId,
      },
    });
    if (!secret) return;
    const isValid = authenticator.check(verifyOtpDto.otp, secret.secret);
    return isValid;
  }
}
