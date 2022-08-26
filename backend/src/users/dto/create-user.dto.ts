import { ApiProperty } from '@nestjs/swagger';

// https://github.com/nestjs/nest/issues/4178

// swaggerのデコレーターは自動生成可
// https://docs.nestjs.com/openapi/cli-plugin

export class CreateUserDto {
  @ApiProperty()
  email!: string;

  @ApiProperty()
  display_name!: string;
}
