import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from 'src/users/users.service';
import { isfinite } from 'src/utils';

import { jwtConstants } from './auth.constants';

// Strategy をどこからインポートするかが重要

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(UsersService) private usersService: UsersService) {
    super({
      // `Authorization: Bearer xxx`
      // の`xxx`をJWTとして抽出する.
      // https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 「対称」な鍵.
      // 対称なので, 署名の作成と検証の両方に同じ鍵を使う.
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    // validate にはデコード済みのJWTのペイロードが渡ってくる.
    // 主張 = ペイロードの中身
    // 検証 = 署名が正しいことの確認
    const { email, sub: id, exp, iat } = payload;
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new UnauthorizedException('no user');
    }
    const now = Date.now();
    console.log('now', now);
    if (isfinite(exp)) {
      console.log('exp', exp);
      if (exp < now / 1000) {
        console.log('invalid by exp');
        throw new UnauthorizedException('already expired');
      }
    }
    if (user.invalidateTokenIssuedBefore && isfinite(iat)) {
      console.log(user.invalidateTokenIssuedBefore, iat);
      if (iat < user.invalidateTokenIssuedBefore.getTime() / 1000) {
        console.log('invalid by iat');
        throw new UnauthorizedException('already expired');
      }
    }
    // TODO: JWTの鍵をユーザごとに変える方法はあるだろうか?
    if (payload.next) {
      console.log('required 2fa');
      throw new UnauthorizedException('required 2fa');
    }
    return { email, id };
  }
}
