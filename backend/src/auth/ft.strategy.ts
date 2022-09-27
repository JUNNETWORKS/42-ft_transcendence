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
    console.log('[FtStrategy]');
  }

  async validate(accessToken: any, refreshToken: any, profile: any, cb: any) {
    // 第2引数
    console.log('[validate]');
    {
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
      const json = await result.json();
      const { id: intra_id, login: intra_nickname, email } = json;
      console.log({
        intra_id,
        intra_nickname,
        email,
      });
      const user = await this.authService.retrieveUser(intra_id, {
        displayName: intra_nickname,
        email,
      });
      console.log({
        ...user,
      });
    }
    return { accessToken, refreshToken, profile, cb };
  }
}
