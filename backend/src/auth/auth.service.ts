import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, pass: string): Promise<any> {
    console.log(email, pass);
    const user = await this.usersService.findByEmail(email);
    if (user) {
      return user;
    }
    return null;
  }
}
