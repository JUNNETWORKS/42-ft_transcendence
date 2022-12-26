import { PickType } from '@nestjs/swagger';

import { CreateMeDto } from './create-me.dto';

export class UpdateMePasswordDto extends PickType(CreateMeDto, [
  'password',
] as const) {}
