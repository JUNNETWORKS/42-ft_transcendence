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
    const payload = { email: user.email, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
