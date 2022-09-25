import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-oauth2';
import { ftConstants } from './auth.constants';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ...ftConstants,
    });
  }

  async validate(payload: any) {
    console.log(payload);
    return { ...payload };
  }
}
