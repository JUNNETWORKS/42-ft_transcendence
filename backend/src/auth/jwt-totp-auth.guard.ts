import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtTotpAuthGuard extends AuthGuard('jwt-totp') {}
