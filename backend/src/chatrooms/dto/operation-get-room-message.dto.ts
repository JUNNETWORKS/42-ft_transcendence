import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class OperationGetRoomMessageDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  roomId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  take!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @ApiProperty()
  cursor?: number;
}
