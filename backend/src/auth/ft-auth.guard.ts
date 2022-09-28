import { AuthGuard } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FtAuthGuard extends AuthGuard('42') {}
