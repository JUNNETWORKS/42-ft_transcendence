// API用DTO

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// https://github.com/nestjs/nest/issues/4178

// swaggerのデコレーターは自動生成可
// https://docs.nestjs.com/openapi/cli-plugin

export class CreateMeDto {
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
  @IsOptional()
  @MinLength(12)
  @MaxLength(60)
  password!: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  avatar?: string;
}
