// DB用DTO

import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt } from 'class-validator';

import { CreateMeDto } from './create-me.dto';

export class CreateUserDto extends PickType(CreateMeDto, [
  'email',
  'displayName',
  'password',
]) {
  @IsInt()
  @IsOptional()
  intraId?: number | null;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isEnabledAvatar?: boolean;
}
