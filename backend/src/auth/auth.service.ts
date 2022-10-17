import { Injectable } from '@nestjs/common';
import { hash_password, UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMinimum } from '../users/entities/user.entity';
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
    data: Omit<UserMinimum, 'intraId' | 'password'>
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
}
