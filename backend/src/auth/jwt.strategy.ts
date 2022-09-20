import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './auth.constants';

// Strategy をどこからインポートするかが重要

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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
    console.log(payload);
    // TODO: JWTの鍵をユーザごとに変える方法はあるだろうか?
    return { email: payload.email, id: payload.sub };
  }
}
