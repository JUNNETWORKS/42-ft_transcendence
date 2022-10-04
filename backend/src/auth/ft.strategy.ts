import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { ftConstants } from './auth.constants';
import { AuthService } from './auth.service';
import * as Fetch from 'node-fetch';

const ftApiConstants = {
  endpointURL: 'https://api.intra.42.fr/v2',
};

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor(private authService: AuthService) {
    super({
      // 第1引数
      ...ftConstants,
    });
  }

  async validate(accessToken: any, refreshToken: any, profile: any, cb: any) {
    // 第2引数
    try {
      // 42APIにアクセスし, 認証した人物が誰なのかを特定する.
      // (GET /v2/me を叩く)
      const url = `${ftApiConstants.endpointURL}/me`;
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };
      const result = await Fetch.default(url, {
        method: 'GET',
        headers,
      });
      const {
        id: intra_id,
        login: intra_nickname,
        email,
      } = await result.json();
      const user = await this.authService.retrieveUser(intra_id, {
        displayName: intra_nickname,
        email,
      });
      cb(null, user);
    } catch (e) {
      cb(e, null);
    }
  }
}
