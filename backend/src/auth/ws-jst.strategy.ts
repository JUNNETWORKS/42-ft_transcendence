import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { jwtConstants } from './auth.constants';
import { JwtStrategy } from './jwt.strategy';

const tokenExtractor = (handshake: any) => handshake?.auth?.token;

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
  constructor(@Inject(JwtStrategy) private jwtStrategy: JwtStrategy) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([tokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    try {
      const result = await this.jwtStrategy.validate(payload);
      return result;
    } catch (e) {
      if (e instanceof HttpException) {
        throw new WsException(e.message);
      }
      throw e;
    }
  }
}
