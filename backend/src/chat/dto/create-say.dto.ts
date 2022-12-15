import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

import { OperationSayDto } from 'src/chatrooms/dto/operation-say.dto';

export class CreateSayDto extends OperationSayDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  userId!: number;
}
