import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class OperationJoinDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  roomId!: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  roomPassword?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  callerId!: number;
}
