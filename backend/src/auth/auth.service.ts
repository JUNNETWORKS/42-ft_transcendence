import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

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
