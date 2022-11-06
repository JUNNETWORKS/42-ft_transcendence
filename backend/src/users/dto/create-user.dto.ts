import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
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

  @IsInt()
  @ApiProperty()
  intraId!: number;

  @IsString()
  password!: string;
}
