// DB用DTO

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInt,
} from 'class-validator';

// https://github.com/nestjs/nest/issues/4178

// swaggerのデコレーターは自動生成可
// https://docs.nestjs.com/openapi/cli-plugin

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @ApiProperty()
  displayName!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(60)
  password!: string;

  @IsInt()
  @IsOptional()
  intraId?: number | null;

  @IsBoolean()
  @IsOptional()
  @ApiProperty()
  isEnabledAvatar?: boolean;
}
