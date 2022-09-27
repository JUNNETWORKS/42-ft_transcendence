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

  async login(user: any) {
    const iat = Date.now() / 1000;
    const payload = {
      email: user.email,
      sub: user.id,
      iat,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      }),
      user,
    };
  }
}
