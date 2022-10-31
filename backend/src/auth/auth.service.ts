import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMinimum } from '../users/entities/user.entity';
import { jwtConstants } from 'src/auth/auth.constants';
import { Socket } from 'socket.io';
import * as Utils from 'src/utils';

export type LoginResult = {
  access_token: string;
  user: any;
};

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(email, pass);
    const user = await this.usersService.findByEmail(email);
    console.log(user);
    if (user) {
      return user;
    }
    return null;
  }

  /**
   * 与えられた`intraId`を持つユーザがいればそれを取得して返す.
   * いなければ登録して返す.
   * @returns Promise\<User\>
   */
  async retrieveUser(intraId: number, data: Omit<UserMinimum, 'intraId'>) {
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
    const createdUser = await this.usersService.create({ intraId, ...data });
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
}
