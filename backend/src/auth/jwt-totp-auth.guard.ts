import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtTotpAuthGuard extends AuthGuard('jwt-totp') {}
