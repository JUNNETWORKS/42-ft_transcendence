import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserMinimum } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(email, pass);
    const user = await this.usersService.findByEmail(email);
    if (user) {
      return user;
    }
    return null;
  }

  // 与えられた`intraId`を持つユーザがいればそれを取得して返す.
  // いなければ登録して返す.
  async retrieveUser(intraId: number, data: Omit<UserMinimum, 'intraId'>) {
    const user = await this.usersService.findByIntraId(intraId);
    console.log('found user?:', !!user);
    if (user) {
      // ユーザがいた -> そのまま返す
      return user;
    }
    // TODO: displayName をユニークにする
    const createdUser = await this.usersService.create({ intraId, ...data });
    console.log('createdUser', createdUser);
    return createdUser;
  }

  async login(user: any) {
    console.log(user);
    const payload = {
      email: user.email,
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
    };
    return {
      access_token: this.jwtService.sign(payload, {
        issuer: 'tra1000',
        audience: 'tra1000',
      }),
    };
  }
}
