import { PickType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

export class UpdateMeDto extends PickType(CreateUserDto, [
  'displayName',
  'password',
  'avatar',
] as const) {}
