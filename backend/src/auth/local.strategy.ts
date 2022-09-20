import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('t1000');

  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log(email, password);
    const user = this.authService.validateUser(email, password);
    console.log(user);
    if (!user) {
      console.log('ok?');
      throw new UnauthorizedException();
    }
    return user;
  }
}
