import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { stall } from './auth-utils';
import { AuthLocker } from './auth.locker';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('t1000');

  constructor(private authService: AuthService, private locker: AuthLocker) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    return stall(500, async () => {
      const [validated, user] = await this.authService.validateUser(
        email,
        password
      );
      if (!validated) {
        if (user) {
          await this.locker.markFailure(user.id);
        }
        throw new UnauthorizedException();
      }
      return user;
    });
  }
}
