import { ApiProperty } from '@nestjs/swagger';
import { LoginResult } from '../auth.service';

export class LoginResultEntity implements LoginResult {
  @ApiProperty()
  access_token!: string;

  @ApiProperty()
  user!: any;
}
