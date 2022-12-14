import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt } from 'class-validator';

export class OperationGetRoomMembersDto {
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
}
