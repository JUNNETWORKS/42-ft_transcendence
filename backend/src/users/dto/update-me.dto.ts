// API用DTO

import { PickType } from '@nestjs/swagger';

import { CreateMeDto } from './create-me.dto';

export class UpdateMeDto extends PickType(CreateMeDto, [
  'displayName',
  'password',
  'avatar',
] as const) {}
